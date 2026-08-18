import { useState, useEffect, useMemo, useCallback } from "react";

// ─── CAMADA DE NOTIFICAÇÕES (Web + Capacitor nativo) ──────────────────────────
// A Web Notification API (Notification.requestPermission / new Notification)
// NÃO funciona dentro do WebView do Android (Capacitor). Para funcionar no
// app publicado, é preciso usar o plugin @capacitor/local-notifications.
// Este módulo detecta o ambiente e usa a API certa automaticamente,
// sem precisar mudar o resto do código do app.

const isNativeApp = () =>
  typeof window !== "undefined" &&
  !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

// Referência preguiçosa ao plugin nativo (só existe dentro do app Android/iOS)
function getLocalNotificationsPlugin() {
  try {
    return window?.Capacitor?.Plugins?.LocalNotifications || null;
  } catch (_) {
    return null;
  }
}

// Estado de permissão unificado: "granted" | "denied" | "default"
async function notifGetPermission() {
  if (isNativeApp()) {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin) return "denied";
    try {
      const { display } = await plugin.checkPermissions();
      // display pode ser "granted" | "denied" | "prompt" | "prompt-with-rationale"
      if (display === "granted") return "granted";
      if (display === "denied")  return "denied";
      return "default";
    } catch (_) {
      return "default";
    }
  }
  // Ambiente navegador / PWA
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission; // "granted" | "denied" | "default"
}

// Solicitar permissão — funciona nos dois ambientes
async function notifRequestPermission() {
  if (isNativeApp()) {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin) return "denied";
    try {
      const { display } = await plugin.requestPermissions();
      return display === "granted" ? "granted" : "denied";
    } catch (_) {
      return "denied";
    }
  }
  if (typeof Notification === "undefined") return "denied";
  try {
    return await Notification.requestPermission();
  } catch (_) {
    return "denied";
  }
}

// Disparar uma notificação imediatamente — funciona nos dois ambientes
let _notifIdCounter = 1000;
async function notifShow(title, body, opts = {}) {
  if (isNativeApp()) {
    const plugin = getLocalNotificationsPlugin();
    if (!plugin) return;
    try {
      await plugin.schedule({
        notifications: [{
          id: _notifIdCounter++,
          title,
          body,
          smallIcon: "ic_stat_icon",
          iconColor: "#D4AF37",
          schedule: opts.delayMs ? { at: new Date(Date.now() + opts.delayMs) } : undefined,
        }],
      });
    } catch (_) { /* silencioso — não travar a UI por falha de notificação */ }
    return;
  }
  // Navegador / PWA
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const fire = () => {
    try {
      new Notification(title, { body, tag: opts.tag, icon: opts.icon || "/icon-192.png" });
    } catch (_) {}
  };
  if (opts.delayMs) setTimeout(fire, opts.delayMs);
  else fire();
}



// ─── HEBREW CALENDAR DATA ────────────────────────────────────────────────────

const HEBREW_MONTHS = [
  { id: 1, name: "Nissan", heb: "נִיסָן", approx: "Mar-Abr",
    desc: { pt:"Mês da redenção", en:"Month of redemption", es:"Mes de la redención", fr:"Mois de la rédemption", de:"Monat der Erlösung", he:"חֹדֶשׁ הַגְּאֻלָּה", ru:"Месяц искупления" } },
  { id: 2, name: "Iyar", heb: "אִיָּר", approx: "Abr-Mai",
    desc: { pt:"Mês da cura", en:"Month of healing", es:"Mes de la sanidad", fr:"Mois de la guérison", de:"Monat der Heilung", he:"חֹדֶשׁ הָרְפוּאָה", ru:"Месяц исцеления" } },
  { id: 3, name: "Sivan", heb: "סִיוָן", approx: "Mai-Jun",
    desc: { pt:"Mês da revelação", en:"Month of revelation", es:"Mes de la revelación", fr:"Mois de la révélation", de:"Monat der Offenbarung", he:"חֹדֶשׁ הַהִתְגַּלּוּת", ru:"Месяц откровения" } },
  { id: 4, name: "Tammuz", heb: "תַּמּוּז", approx: "Jun-Jul",
    desc: { pt:"Mês da visão", en:"Month of vision", es:"Mes de la visión", fr:"Mois de la vision", de:"Monat der Vision", he:"חֹדֶשׁ הֶחָזוֹן", ru:"Месяц видения" } },
  { id: 5, name: "Av", heb: "אָב", approx: "Jul-Ago",
    desc: { pt:"Mês da consolação", en:"Month of consolation", es:"Mes de la consolación", fr:"Mois de la consolation", de:"Monat des Trostes", he:"חֹדֶשׁ הַנֶּחָמָה", ru:"Месяц утешения" } },
  { id: 6, name: "Elul", heb: "אֱלוּל", approx: "Ago-Set",
    desc: { pt:"Mês do arrependimento", en:"Month of repentance", es:"Mes del arrepentimiento", fr:"Mois du repentir", de:"Monat der Buße", he:"חֹדֶשׁ הַתְּשׁוּבָה", ru:"Месяц покаяния" } },
  { id: 7, name: "Tishrei", heb: "תִּשְׁרֵי", approx: "Set-Out",
    desc: { pt:"Mês das festas", en:"Month of feasts", es:"Mes de las fiestas", fr:"Mois des fêtes", de:"Monat der Feste", he:"חֹדֶשׁ הַמּוֹעֲדִים", ru:"Месяц праздников" } },
  { id: 8, name: "Cheshvan", heb: "חֶשְׁוָן", approx: "Out-Nov",
    desc: { pt:"Mês da chuva", en:"Month of rain", es:"Mes de la lluvia", fr:"Mois de la pluie", de:"Monat des Regens", he:"חֹדֶשׁ הַגֶּשֶׁם", ru:"Месяц дождя" } },
  { id: 9, name: "Kislev", heb: "כִּסְלֵו", approx: "Nov-Dez",
    desc: { pt:"Mês da luz", en:"Month of light", es:"Mes de la luz", fr:"Mois de la lumière", de:"Monat des Lichts", he:"חֹדֶשׁ הָאוֹר", ru:"Месяц света" } },
  { id: 10, name: "Tevet", heb: "טֵבֵת", approx: "Dez-Jan",
    desc: { pt:"Mês da ira santa", en:"Month of holy anger", es:"Mes de la ira santa", fr:"Mois de la colère sainte", de:"Monat des heiligen Zorns", he:"חֹדֶשׁ הַזַּעַם הַקָּדוֹשׁ", ru:"Месяц святого гнева" } },
  { id: 11, name: "Shevat", heb: "שְׁבָט", approx: "Jan-Fev",
    desc: { pt:"Mês da renovação", en:"Month of renewal", es:"Mes de la renovación", fr:"Mois du renouveau", de:"Monat der Erneuerung", he:"חֹדֶשׁ הַהִתְחַדְּשׁוּת", ru:"Месяц обновления" } },
  { id: 12, name: "Adar", heb: "אֲדָר", approx: "Fev-Mar",
    desc: { pt:"Mês da alegria", en:"Month of joy", es:"Mes de la alegría", fr:"Mois de la joie", de:"Monat der Freude", he:"חֹדֶשׁ הַשִּׂמְחָה", ru:"Месяц радости" } },
  { id: 13, name: "Adar II", heb: "אֲדָר ב׳", approx: "Mar-Abr",
    desc: { pt:"Segundo Adar", en:"Second Adar", es:"Segundo Adar", fr:"Second Adar", de:"Zweiter Adar", he:"אֲדָר שֵׁנִי", ru:"Второй Адар" } },
];

const BIBLICAL_FEASTS = [
  { name: "Pessach", heb: "פֶּסַח", date: "15 Nissan", month: 1, day: 15, dur: 7, cat: "spring", emoji: "🐑",
    desc: { pt:"Celebra a libertação do povo de Israel da escravidão no Egito.", en:"Celebrates the liberation of the people of Israel from slavery in Egypt.", es:"Celebra la liberación del pueblo de Israel de la esclavitud en Egipto.", fr:"Célèbre la libération du peuple d'Israël de l'esclavage en Égypte.", de:"Feiert die Befreiung des Volkes Israel aus der Sklaverei in Ägypten.", he:"חוֹגֵג אֶת שִׁחְרוּר עַם יִשְׂרָאֵל מֵעַבְדוּת מִצְרַיִם.", ru:"Празднует освобождение народа Израиля от рабства в Египте." },
    sig: { pt:"Yeshua é o Cordeiro Pascal sacrificado por nós. A última ceia foi um Seder de Pessach.", en:"Yeshua is the Passover Lamb sacrificed for us. The Last Supper was a Passover Seder.", es:"Yeshúa es el Cordero Pascual sacrificado por nosotros. La última cena fue un Séder de Pésaj.", fr:"Yeshua est l'Agneau pascal sacrifié pour nous. La Cène était un Seder de Pessah.", de:"Jeschua ist das Passahlamm, das für uns geopfert wurde. Das letzte Abendmahl war ein Pessach-Seder.", he:"יֵשׁוּעַ הוּא שֵׂה הַפֶּסַח שֶׁנִּזְבַּח בַּעֲדֵנוּ. הַסְּעֻדָּה הָאַחֲרוֹנָה הָיְתָה סֵדֶר פֶּסַח.", ru:"Йешуа — пасхальный Агнец, принесённый в жертву за нас. Тайная вечеря была седером Песаха." },
    scripture: "Êxodo 12:1-14; 1 Coríntios 5:7" },
  { name: "Pães Ázimos", heb: "חַג הַמַּצּוֹת", date: "15-21 Nissan", month: 1, day: 15, dur: 7, cat: "spring", emoji: "🫓",
    desc: { pt:"Sete dias comendo pão sem fermento, lembrando a pressa da saída do Egito.", en:"Seven days eating unleavened bread, remembering the haste of the exodus from Egypt.", es:"Siete días comiendo pan sin levadura, recordando la prisa de la salida de Egipto.", fr:"Sept jours à manger du pain sans levain, se souvenant de la hâte de la sortie d'Égypte.", de:"Sieben Tage ungesäuertes Brot essen, in Erinnerung an die Eile des Auszugs aus Ägypten.", he:"שִׁבְעָה יָמִים אוֹכְלִים מַצּוֹת, לְזֵכֶר הַחִפָּזוֹן שֶׁל יְצִיאַת מִצְרַיִם.", ru:"Семь дней едят пресный хлеб, вспоминая поспешность исхода из Египта." },
    sig: { pt:"O fermento representa o pecado. Yeshua é o Pão da Vida sem pecado.", en:"Leaven represents sin. Yeshua is the Bread of Life without sin.", es:"La levadura representa el pecado. Yeshúa es el Pan de Vida sin pecado.", fr:"Le levain représente le péché. Yeshua est le Pain de Vie sans péché.", de:"Sauerteig steht für Sünde. Jeschua ist das Brot des Lebens ohne Sünde.", he:"הַחָמֵץ מְסַמֵּל אֶת הַחֵטְא. יֵשׁוּעַ הוּא לֶחֶם הַחַיִּים לְלֹא חֵטְא.", ru:"Закваска символизирует грех. Йешуа — безгрешный Хлеб жизни." },
    scripture: "Levítico 23:6-8; João 6:35" },
  { name: "Primícias", heb: "יוֹם הַבִּכּוּרִים", date: "16 Nissan", month: 1, day: 16, dur: 1, cat: "spring", emoji: "🌾",
    desc: { pt:"Oferenda dos primeiros frutos da colheita da cevada.", en:"Offering of the first fruits of the barley harvest.", es:"Ofrenda de los primeros frutos de la cosecha de cebada.", fr:"Offrande des premiers fruits de la récolte d'orge.", de:"Opfergabe der Erstlingsfrüchte der Gerstenernte.", he:"קָרְבַּן בִּכּוּרֵי קְצִיר הַשְּׂעוֹרָה.", ru:"Приношение первых плодов урожая ячменя." },
    sig: { pt:"Yeshua ressuscitou neste dia, sendo as primícias dos que dormem.", en:"Yeshua rose on this day, being the firstfruits of those who sleep.", es:"Yeshúa resucitó este día, siendo las primicias de los que duermen.", fr:"Yeshua est ressuscité ce jour-là, étant les prémices de ceux qui dorment.", de:"Jeschua ist an diesem Tag auferstanden, als Erstling der Entschlafenen.", he:"יֵשׁוּעַ קָם לִתְחִיָּה בַּיּוֹם הַזֶּה, בְּכוֹרֵי הַיְּשֵׁנִים.", ru:"Йешуа воскрес в этот день, будучи первенцем из умерших." },
    scripture: "Levítico 23:9-14; 1 Coríntios 15:20-23" },
  { name: "Shavuot", heb: "שָׁבוּעוֹת", date: "6 Sivan", month: 3, day: 6, dur: 2, cat: "spring", emoji: "🔥",
    desc: { pt:"Festa das Semanas, 50 dias após Pessach. Celebra a entrega da Torá no Sinai.", en:"Feast of Weeks, 50 days after Passover. Celebrates the giving of the Torah at Sinai.", es:"Fiesta de las Semanas, 50 días después de Pésaj. Celebra la entrega de la Torá en el Sinaí.", fr:"Fête des Semaines, 50 jours après Pessah. Célèbre le don de la Torah au Sinaï.", de:"Wochenfest, 50 Tage nach Pessach. Feiert die Übergabe der Tora am Sinai.", he:"חַג הַשָּׁבוּעוֹת, 50 יוֹם אַחֲרֵי פֶּסַח. חוֹגֵג אֶת מַתַּן תּוֹרָה בְּסִינַי.", ru:"Праздник Недель, через 50 дней после Песаха. Празднует дарование Торы на Синае." },
    sig: { pt:"O Espírito Santo foi derramado em Shavuot (Atos 2). A Lei escrita no coração.", en:"The Holy Spirit was poured out on Shavuot (Acts 2). The Law written on the heart.", es:"El Espíritu Santo fue derramado en Shavuot (Hechos 2). La Ley escrita en el corazón.", fr:"Le Saint-Esprit a été répandu à Chavouot (Actes 2). La Loi écrite dans le cœur.", de:"Der Heilige Geist wurde an Schawuot ausgegossen (Apg 2). Das Gesetz ins Herz geschrieben.", he:"רוּחַ הַקֹּדֶשׁ נִשְׁפְּכָה בְּשָׁבוּעוֹת (מַעֲשֵׂי הַשְּׁלִיחִים ב). הַתּוֹרָה כְּתוּבָה עַל הַלֵּב.", ru:"Святой Дух излился в Шавуот (Деяния 2). Закон, написанный на сердце." },
    scripture: "Levítico 23:15-21; Atos 2:1-4" },
  { name: "Yom Teruah", heb: "יוֹם תְּרוּעָה", date: "1 Tishrei", month: 7, day: 1, dur: 2, cat: "fall", emoji: "🎺",
    desc: { pt:"Dia do Toque do Shofar. Marca o início do ano civil judaico.", en:"Day of the Sounding of the Shofar. Marks the start of the Jewish civil year.", es:"Día del Toque del Shofar. Marca el inicio del año civil judío.", fr:"Jour de la Sonnerie du Shofar. Marque le début de l'année civile juive.", de:"Tag des Schofarblasens. Markiert den Beginn des jüdischen bürgerlichen Jahres.", he:"יוֹם תְּקִיעַת הַשּׁוֹפָר. מְצַיֵּן אֶת תְּחִלַּת הַשָּׁנָה הָאֶזְרָחִית הַיְּהוּדִית.", ru:"День трубного звука шофара. Отмечает начало еврейского гражданского года." },
    sig: { pt:"Simboliza o retorno do Messias com som de trombeta.", en:"Symbolizes the return of the Messiah with the sound of a trumpet.", es:"Simboliza el regreso del Mesías con sonido de trompeta.", fr:"Symbolise le retour du Messie au son de la trompette.", de:"Symbolisiert die Rückkehr des Messias mit Posaunenschall.", he:"מְסַמֵּל אֶת שִׁיבַת הַמָּשִׁיחַ בְּקוֹל שׁוֹפָר.", ru:"Символизирует возвращение Мессии со звуком трубы." },
    scripture: "Levítico 23:23-25; 1 Tessalonicenses 4:16-17" },
  { name: "Yom Kippur", heb: "יוֹם כִּפּוּר", date: "10 Tishrei", month: 7, day: 10, dur: 1, cat: "fall", emoji: "✨",
    desc: { pt:"O dia mais sagrado do ano. Dia de jejum, arrependimento e expiação.", en:"The holiest day of the year. A day of fasting, repentance and atonement.", es:"El día más sagrado del año. Día de ayuno, arrepentimiento y expiación.", fr:"Le jour le plus saint de l'année. Jour de jeûne, de repentance et d'expiation.", de:"Der heiligste Tag des Jahres. Ein Tag des Fastens, der Buße und der Versöhnung.", he:"הַיּוֹם הַקָּדוֹשׁ בְּיוֹתֵר בַּשָּׁנָה. יוֹם צוֹם, תְּשׁוּבָה וְכַפָּרָה.", ru:"Самый святой день года. День поста, покаяния и искупления." },
    sig: { pt:"Yeshua é nosso Sumo Sacerdote que entrou no Santo dos Santos com Seu próprio sangue.", en:"Yeshua is our High Priest who entered the Holy of Holies with His own blood.", es:"Yeshúa es nuestro Sumo Sacerdote que entró en el Lugar Santísimo con Su propia sangre.", fr:"Yeshua est notre Souverain Sacrificateur qui est entré dans le Lieu Très Saint avec Son propre sang.", de:"Jeschua ist unser Hohepriester, der mit Seinem eigenen Blut ins Allerheiligste eintrat.", he:"יֵשׁוּעַ הוּא כֹּהֲנֵנוּ הַגָּדוֹל שֶׁנִּכְנַס לְקֹדֶשׁ הַקֳּדָשִׁים בְּדָמוֹ שֶׁלּוֹ.", ru:"Йешуа — наш Первосвященник, вошедший во Святое Святых со Своей собственной кровью." },
    scripture: "Levítico 23:26-32; Hebreus 9:11-12" },
  { name: "Sukkot", heb: "סוּכּוֹת", date: "15 Tishrei", month: 7, day: 15, dur: 7, cat: "fall", emoji: "🌿",
    desc: { pt:"Festa das Cabanas. Sete dias lembrando a peregrinação no deserto.", en:"Feast of Tabernacles. Seven days remembering the wilderness journey.", es:"Fiesta de los Tabernáculos. Siete días recordando la peregrinación en el desierto.", fr:"Fête des Tabernacles. Sept jours en souvenir du voyage dans le désert.", de:"Laubhüttenfest. Sieben Tage in Erinnerung an die Wüstenwanderung.", he:"חַג הַסֻּכּוֹת. שִׁבְעָה יָמִים לְזֵכֶר הַמַּסָּע בַּמִּדְבָּר.", ru:"Праздник Кущей. Семь дней в память о странствии в пустыне." },
    sig: { pt:"Deus tabernaculou entre nós em Yeshua (João 1:14).", en:"God tabernacled among us in Yeshua (John 1:14).", es:"Dios tabernaculizó entre nosotros en Yeshúa (Juan 1:14).", fr:"Dieu a habité parmi nous en Yeshua (Jean 1:14).", de:"Gott wohnte unter uns in Jeschua (Johannes 1:14).", he:"אֱלֹהִים שָׁכַן בְּתוֹכֵנוּ בְּיֵשׁוּעַ (יוֹחָנָן א:יד).", ru:"Бог обитал среди нас в Йешуа (Иоанна 1:14)." },
    scripture: "Levítico 23:33-43; João 1:14; 7:37-38" },
  { name: "Shemini Atzeret", heb: "שְׁמִינִי עֲצֶרֶת", date: "22 Tishrei", month: 7, day: 22, dur: 1, cat: "fall", emoji: "🕊️",
    desc: { pt:"O Oitavo Dia de Assembleia. Conclusão festiva de Sukkot.", en:"The Eighth Day of Assembly. Festive conclusion of Sukkot.", es:"El Octavo Día de Asamblea. Conclusión festiva de Sucot.", fr:"Le Huitième Jour d'Assemblée. Conclusion festive de Souccot.", de:"Der achte Versammlungstag. Festlicher Abschluss von Sukkot.", he:"יוֹם הָעֲצֶרֶת הַשְּׁמִינִי. סִיּוּם חֲגִיגִי שֶׁל סֻכּוֹת.", ru:"Восьмой день собрания. Праздничное завершение Суккота." },
    sig: { pt:"Representa a eternidade com Deus, o \"oitavo dia\" além do ciclo de sete.", en:"Represents eternity with God, the \"eighth day\" beyond the cycle of seven.", es:"Representa la eternidad con Dios, el \"octavo día\" más allá del ciclo de siete.", fr:"Représente l'éternité avec Dieu, le \"huitième jour\" au-delà du cycle de sept.", de:"Steht für die Ewigkeit mit Gott, den \"achten Tag\" jenseits des Sieben-Zyklus.", he:"מְיַצֵּג אֶת הַנֶּצַח עִם אֱלֹהִים, \"הַיּוֹם הַשְּׁמִינִי\" מֵעֵבֶר לְמַחְזוֹר הַשִּׁבְעָה.", ru:"Представляет вечность с Богом, «восьмой день» за пределами цикла семи." },
    scripture: "Levítico 23:36; Números 29:35" },
  { name: "Chanukah", heb: "חֲנוּכָּה", date: "25 Kislev", month: 9, day: 25, dur: 8, cat: "other", emoji: "🕎",
    desc: { pt:"Festa das Luzes. Celebra a rededicação do Templo.", en:"Feast of Lights. Celebrates the rededication of the Temple.", es:"Fiesta de las Luces. Celebra la rededicación del Templo.", fr:"Fête des Lumières. Célèbre la rededication du Temple.", de:"Lichterfest. Feiert die Neuweihe des Tempels.", he:"חַג הָאוֹרִים. חוֹגֵג אֶת חֲנֻכַּת הַמִּקְדָּשׁ מֵחָדָשׁ.", ru:"Праздник Огней. Празднует повторное освящение Храма." },
    sig: { pt:"Yeshua é a Luz do Mundo. Ele celebrou Chanukah (João 10:22-23).", en:"Yeshua is the Light of the World. He celebrated Chanukah (John 10:22-23).", es:"Yeshúa es la Luz del Mundo. Él celebró Janucá (Juan 10:22-23).", fr:"Yeshua est la Lumière du Monde. Il a célébré Hanoucca (Jean 10:22-23).", de:"Jeschua ist das Licht der Welt. Er feierte Chanukka (Johannes 10:22-23).", he:"יֵשׁוּעַ הוּא אוֹר הָעוֹלָם. הוּא חָגַג אֶת חֲנֻכָּה (יוֹחָנָן י:כב-כג).", ru:"Йешуа — Свет миру. Он праздновал Хануку (Иоанна 10:22-23)." },
    scripture: "João 10:22-23; Daniel 8:9-14" },
  { name: "Purim", heb: "פּוּרִים", date: "14 Adar", month: 12, day: 14, dur: 2, cat: "other", emoji: "🎭",
    desc: { pt:"Celebra a salvação dos judeus na Pérsia através da rainha Ester.", en:"Celebrates the salvation of the Jews in Persia through Queen Esther.", es:"Celebra la salvación de los judíos en Persia a través de la reina Ester.", fr:"Célèbre le salut des Juifs en Perse par la reine Esther.", de:"Feiert die Rettung der Juden in Persien durch Königin Ester.", he:"חוֹגֵג אֶת יְשׁוּעַת הַיְּהוּדִים בְּפָרַס עַל יְדֵי אֶסְתֵּר הַמַּלְכָּה.", ru:"Празднует спасение евреев в Персии через царицу Есфирь." },
    sig: { pt:"Demonstra a providência divina e proteção do povo de Deus.", en:"Demonstrates divine providence and protection of God's people.", es:"Demuestra la providencia divina y protección del pueblo de Dios.", fr:"Démontre la providence divine et la protection du peuple de Dieu.", de:"Zeigt die göttliche Vorsehung und den Schutz von Gottes Volk.", he:"מַדְגִּים אֶת הַהַשְׁגָּחָה הָאֱלֹהִית וְהָגָנָה עַל עַם ה'.", ru:"Демонстрирует божественное провидение и защиту народа Божьего." },
    scripture: "Ester 9:20-28" },
  { name: "Tisha B'Av", heb: "תִּשְׁעָה בְּאָב", date: "9 Av", month: 5, day: 9, dur: 1, cat: "other", emoji: "🕯️",
    desc: { pt:"O dia mais triste do calendário judaico. Jejum que relembra a destruição do Primeiro e do Segundo Templo de Jerusalém, além de outras tragédias históricas do povo judeu.", en:"The saddest day of the Jewish calendar. A fast recalling the destruction of the First and Second Temple of Jerusalem, and other historical tragedies of the Jewish people.", es:"El día más triste del calendario judío. Ayuno que recuerda la destrucción del Primer y Segundo Templo de Jerusalén, además de otras tragedias históricas del pueblo judío.", fr:"Le jour le plus triste du calendrier juif. Un jeûne rappelant la destruction du Premier et du Second Temple de Jérusalem, et d'autres tragédies historiques du peuple juif.", de:"Der traurigste Tag des jüdischen Kalenders. Ein Fasten zur Erinnerung an die Zerstörung des Ersten und Zweiten Tempels in Jerusalem sowie andere historische Tragödien des jüdischen Volkes.", he:"הַיּוֹם הָעָצוּב בְּיוֹתֵר בַּלּוּחַ הַיְּהוּדִי. צוֹם לְזֵכֶר חֻרְבַּן בֵּית הַמִּקְדָּשׁ הָרִאשׁוֹן וְהַשֵּׁנִי.", ru:"Самый печальный день еврейского календаря. Пост в память о разрушении Первого и Второго Храма в Иерусалиме и других исторических трагедиях еврейского народа." },
    sig: { pt:"Assim como o Templo foi destruído, Yeshua chorou sobre Jerusalém (Lucas 19:41-44) e é Ele quem reconstrói o verdadeiro templo — Seu próprio corpo (João 2:19-21) e a Igreja como templo do Espírito.", en:"Just as the Temple was destroyed, Yeshua wept over Jerusalem (Luke 19:41-44) and it is He who rebuilds the true temple — His own body (John 2:19-21) and the Church as temple of the Spirit.", es:"Así como el Templo fue destruido, Yeshúa lloró sobre Jerusalén (Lucas 19:41-44) y es Él quien reconstruye el verdadero templo — Su propio cuerpo (Juan 2:19-21) y la Iglesia como templo del Espíritu.", fr:"Tout comme le Temple a été détruit, Yeshua a pleuré sur Jérusalem (Luc 19:41-44) et c'est Lui qui reconstruit le vrai temple — Son propre corps (Jean 2:19-21) et l'Église comme temple de l'Esprit.", de:"So wie der Tempel zerstört wurde, weinte Jeschua über Jerusalem (Lukas 19:41-44), und Er ist es, der den wahren Tempel wiederaufbaut — Seinen eigenen Körper (Johannes 2:19-21) und die Gemeinde als Tempel des Geistes.", he:"כְּשֵׁם שֶׁבֵּית הַמִּקְדָּשׁ נֶחֱרַב, יֵשׁוּעַ בָּכָה עַל יְרוּשָׁלַיִם (לוּקָס יט:מא-מד) וְהוּא זֶה שֶׁבּוֹנֶה מֵחָדָשׁ אֶת הַמִּקְדָּשׁ הָאֲמִתִּי.", ru:"Как и Храм был разрушен, Йешуа плакал об Иерусалиме (Луки 19:41-44), и именно Он восстанавливает истинный храм — Своё собственное тело (Иоанна 2:19-21) и Церковь как храм Духа." },
    scripture: "Lamentações 1:1-3; Lucas 19:41-44; João 2:19-21" },
  { name: "Tu B'Av", heb: "ט״ו בְּאָב", date: "15 Av", month: 5, day: 15, dur: 1, cat: "other", emoji: "💐",
    desc: { pt:"Conhecido como o 'Dia do Amor' judaico. Uma festa de alegria e renovação que celebra o amor, os casamentos e a colheita das uvas, marcando a transição da tristeza de Tisha B'Av para a esperança.", en:"Known as the Jewish 'Day of Love'. A feast of joy and renewal celebrating love, marriages and the grape harvest, marking the transition from the sorrow of Tisha B'Av to hope.", es:"Conocido como el 'Día del Amor' judío. Una fiesta de alegría y renovación que celebra el amor, los matrimonios y la cosecha de uvas, marcando la transición de la tristeza de Tisha B'Av a la esperanza.", fr:"Connu comme le 'Jour de l'Amour' juif. Une fête de joie et de renouveau célébrant l'amour, les mariages et la récolte des raisins, marquant la transition de la tristesse de Tisha B'Av vers l'espoir.", de:"Bekannt als der jüdische 'Tag der Liebe'. Ein Fest der Freude und Erneuerung, das die Liebe, Ehen und die Traubenernte feiert und den Übergang von der Trauer des Tisha B'Av zur Hoffnung markiert.", he:"יָדוּעַ כְּ'יוֹם הָאַהֲבָה' הַיְּהוּדִי. חַג שִׂמְחָה וְהִתְחַדְּשׁוּת הַחוֹגֵג אֶת הָאַהֲבָה, נִשּׂוּאִים וּבְצִיר הָעֲנָבִים.", ru:"Известен как еврейский «День любви». Праздник радости и обновления, празднующий любовь, браки и сбор винограда, знаменующий переход от скорби Тиша бе-Ав к надежде." },
    sig: { pt:"Representa a restauração da alegria após o luto — um retrato profético da transformação do pranto em dança (Salmos 30:11) e do relacionamento de amor entre Yeshua e Sua noiva, a Igreja.", en:"Represents the restoration of joy after mourning — a prophetic picture of turning mourning into dancing (Psalm 30:11) and the love relationship between Yeshua and His bride, the Church.", es:"Representa la restauración de la alegría después del luto — un retrato profético de la transformación del llanto en danza (Salmos 30:11) y de la relación de amor entre Yeshúa y Su novia, la Iglesia.", fr:"Représente la restauration de la joie après le deuil — un tableau prophétique de la transformation du deuil en danse (Psaume 30:11) et de la relation d'amour entre Yeshua et Son épouse, l'Église.", de:"Steht für die Wiederherstellung der Freude nach der Trauer — ein prophetisches Bild der Verwandlung von Klage in Tanz (Psalm 30:11) und der Liebesbeziehung zwischen Jeschua und Seiner Braut, der Gemeinde.", he:"מְיַצֵּג אֶת שִׁחְזוּר הַשִּׂמְחָה אַחֲרֵי הָאֵבֶל — תְּמוּנָה נְבוּאִית שֶׁל הֲפִיכַת מִסְפֵּד לְמָחוֹל (תְּהִלִּים ל:יב).", ru:"Представляет восстановление радости после траура — пророческий образ превращения плача в танец (Псалом 30:11) и отношений любви между Йешуа и Его невестой, Церковью." },
    scripture: "Salmos 30:11; Cantares 3:11; Efésios 5:25-27" },
];

// ─── PARASHAT HASHAVUA 5786 — CALENDÁRIO REAL (Hebcal / Shivim Panim L'Torah)
// Cada entrada: dataDiaspora = data do Shabat na Diáspora (fora de Israel)
// dataIsrael = data do Shabat em Israel (quando diferente)
// double = porção dupla lida na Diáspora nessa semana
// Fonte: hebcal.com + seventyfacesoftorah.com — Ano 5786 (2025-2026)

const PARASHOT_5786 = [
  // ── BERESHIT / Gênesis ──
  {
    num: 1, name: "Bereshit", heb: "בְּרֵאשִׁית", ref: "Gn 1:1–6:8",
    haftara: "Isaías 42:5-21",
    brit: "João 1:1-18",
    theme: "A criação do mundo e da humanidade",
    dataDiaspora: "2025-10-18", dataIsrael: null,
    hebrewDate: "26 Tishrei 5786", book: "Bereshit",
  },
  {
    num: 2, name: "Noach", heb: "נֹחַ", ref: "Gn 6:9–11:32",
    haftara: "Isaías 54:1-10",
    brit: "Mateus 24:36-44",
    theme: "O dilúvio, a arca e a aliança do arco-íris",
    dataDiaspora: "2025-10-25", dataIsrael: null,
    hebrewDate: "3 Cheshvan 5786", book: "Bereshit",
  },
  {
    num: 3, name: "Lech Lecha", heb: "לֶךְ-לְךָ", ref: "Gn 12:1–17:27",
    haftara: "Isaías 40:27–41:16",
    brit: "Romanos 4:1-25",
    theme: "A chamada de Avraham e a aliança da circuncisão",
    dataDiaspora: "2025-11-01", dataIsrael: null,
    hebrewDate: "10 Cheshvan 5786", book: "Bereshit",
  },
  {
    num: 4, name: "Vayera", heb: "וַיֵּרָא", ref: "Gn 18:1–22:24",
    haftara: "2 Reis 4:1-37",
    brit: "Hebreus 11:8-19",
    theme: "Os três visitantes, Sodoma e a provação de Avraham",
    dataDiaspora: "2025-11-08", dataIsrael: null,
    hebrewDate: "17 Cheshvan 5786", book: "Bereshit",
  },
  {
    num: 5, name: "Chayei Sarah", heb: "חַיֵּי שָׂרָה", ref: "Gn 23:1–25:18",
    haftara: "1 Reis 1:1-31",
    brit: "1 Pedro 3:1-6",
    theme: "A morte de Sara e o casamento de Yitzchak com Rivka",
    dataDiaspora: "2025-11-15", dataIsrael: null,
    hebrewDate: "24 Cheshvan 5786", book: "Bereshit",
  },
  {
    num: 6, name: "Toldot", heb: "תּוֹלְדֹת", ref: "Gn 25:19–28:9",
    haftara: "Malaquias 1:1–2:7",
    brit: "Romanos 9:1-16",
    theme: "Esav e Yaakov — as duas nações no ventre de Rivka",
    dataDiaspora: "2025-11-22", dataIsrael: null,
    hebrewDate: "2 Kislev 5786", book: "Bereshit",
  },
  {
    num: 7, name: "Vayetze", heb: "וַיֵּצֵא", ref: "Gn 28:10–32:3",
    haftara: "Oséias 11:7–12:14",
    brit: "João 1:43-51",
    theme: "A escada de Yaakov, Laban e o nascimento das tribos",
    dataDiaspora: "2025-11-29", dataIsrael: null,
    hebrewDate: "9 Kislev 5786", book: "Bereshit",
  },
  {
    num: 8, name: "Vayishlach", heb: "וַיִּשְׁלַח", ref: "Gn 32:4–36:43",
    haftara: "Obadias 1:1-21",
    brit: "Hebreus 12:3-15",
    theme: "Yaakov luta com o anjo, se reconcilia com Esav e recebe o nome Israel",
    dataDiaspora: "2025-12-06", dataIsrael: null,
    hebrewDate: "16 Kislev 5786", book: "Bereshit",
  },
  {
    num: 9, name: "Vayeshev", heb: "וַיֵּשֶׁב", ref: "Gn 37:1–40:23",
    haftara: "Amós 2:6–3:8",
    brit: "Atos 7:9-16",
    theme: "Yosef é vendido pelos irmãos e interpreta sonhos na prisão",
    dataDiaspora: "2025-12-13", dataIsrael: null,
    hebrewDate: "23 Kislev 5786", book: "Bereshit",
  },
  {
    num: 10, name: "Miketz", heb: "מִקֵּץ", ref: "Gn 41:1–44:17",
    haftara: "Zacarias 2:14–4:7",
    brit: "João 6:1-14",
    theme: "Yosef interpreta os sonhos do Faraó e se torna governador do Egito",
    dataDiaspora: "2025-12-20", dataIsrael: null,
    hebrewDate: "30 Kislev 5786", book: "Bereshit",
    nota: "Shabat de Chanukah — leitura adicional de Números 7",
  },
  {
    num: 11, name: "Vayigash", heb: "וַיִּגַּשׁ", ref: "Gn 44:18–47:27",
    haftara: "Ezequiel 37:15-28",
    brit: "Efésios 2:11-18",
    theme: "Yosef se revela aos irmãos; Yaakov desce ao Egito",
    dataDiaspora: "2025-12-27", dataIsrael: null,
    hebrewDate: "7 Tevet 5786", book: "Bereshit",
  },
  {
    num: 12, name: "Vayechi", heb: "וַיְחִי", ref: "Gn 47:28–50:26",
    haftara: "1 Reis 2:1-12",
    brit: "Hebreus 11:21-22",
    theme: "As bênçãos finais de Yaakov às doze tribos e sua morte",
    dataDiaspora: "2026-01-03", dataIsrael: null,
    hebrewDate: "14 Tevet 5786", book: "Bereshit",
  },
  // ── SHEMOT / Êxodo ──
  {
    num: 13, name: "Shemot", heb: "שְׁמוֹת", ref: "Êx 1:1–6:1",
    haftara: "Isaías 27:6–28:13; 29:22-23",
    brit: "Atos 7:17-36",
    theme: "O nascimento de Moshe, a sarça ardente e o chamado de Deus",
    dataDiaspora: "2026-01-10", dataIsrael: null,
    hebrewDate: "21 Tevet 5786", book: "Shemot",
  },
  {
    num: 14, name: "Va'era", heb: "וָאֵרָא", ref: "Êx 6:2–9:35",
    haftara: "Ezequiel 28:25–29:21",
    brit: "Romanos 9:14-18",
    theme: "Deus revela Seu nome e envia as primeiras sete pragas ao Egito",
    dataDiaspora: "2026-01-17", dataIsrael: null,
    hebrewDate: "28 Tevet 5786", book: "Shemot",
  },
  {
    num: 15, name: "Bo", heb: "בֹּא", ref: "Êx 10:1–13:16",
    haftara: "Jeremias 46:13-28",
    brit: "1 Coríntios 5:6-8",
    theme: "As últimas três pragas, o Pessach e a saída do Egito",
    dataDiaspora: "2026-01-24", dataIsrael: null,
    hebrewDate: "6 Shevat 5786", book: "Shemot",
  },
  {
    num: 16, name: "Beshalach", heb: "בְּשַׁלַּח", ref: "Êx 13:17–17:16",
    haftara: "Juízes 4:4–5:31",
    brit: "1 Coríntios 10:1-4",
    theme: "A travessia do Mar Vermelho e o Cântico de Moshe",
    dataDiaspora: "2026-01-31", dataIsrael: null,
    hebrewDate: "13 Shevat 5786", book: "Shemot",
    nota: "Shabat Shirah — Shabat do Cântico",
  },
  {
    num: 17, name: "Yitro", heb: "יִתְרוֹ", ref: "Êx 18:1–20:23",
    haftara: "Isaías 6:1-13",
    brit: "Hebreus 12:18-29",
    theme: "Yitro visita Moshe; Os Dez Mandamentos são dados no Monte Sinai",
    dataDiaspora: "2026-02-07", dataIsrael: null,
    hebrewDate: "20 Shevat 5786", book: "Shemot",
  },
  {
    num: 18, name: "Mishpatim", heb: "מִשְׁפָּטִים", ref: "Êx 21:1–24:18",
    haftara: "2 Reis 11:17–12:17",
    brit: "Mateus 5:38-42",
    theme: "As leis civis e sociais da aliança no Sinai",
    dataDiaspora: "2026-02-14", dataIsrael: null,
    hebrewDate: "27 Shevat 5786", book: "Shemot",
    nota: "Shabat Shekalim — leitura adicional de Êxodo 30:11-16",
  },
  {
    num: 19, name: "Terumah", heb: "תְּרוּמָה", ref: "Êx 25:1–27:19",
    haftara: "1 Reis 5:26–6:13",
    brit: "Hebreus 9:1-14",
    theme: "As instruções detalhadas para a construção do Mishkan (Tabernáculo)",
    dataDiaspora: "2026-02-21", dataIsrael: null,
    hebrewDate: "4 Adar 5786", book: "Shemot",
  },
  {
    num: 20, name: "Tetzaveh", heb: "תְּצַוֶּה", ref: "Êx 27:20–30:10",
    haftara: "1 Samuel 15:1-34",
    brit: "Hebreus 7:23-28",
    theme: "As vestes sagradas dos sacerdotes e a consagração de Aharon",
    dataDiaspora: "2026-02-28", dataIsrael: null,
    hebrewDate: "11 Adar 5786", book: "Shemot",
    nota: "Shabat Zachor — leitura adicional de Dt 25:17-19",
  },
  {
    num: 21, name: "Ki Tisa", heb: "כִּי תִשָּׂא", ref: "Êx 30:11–34:35",
    haftara: "Ezequiel 36:16-36",
    brit: "2 Coríntios 3:7-18",
    theme: "O Censo, o Shabat, o Bezerro de Ouro e a renovação da aliança",
    dataDiaspora: "2026-03-07", dataIsrael: null,
    hebrewDate: "18 Adar 5786", book: "Shemot",
    nota: "Shabat Parah — leitura adicional de Números 19:1-22",
  },
  {
    num: 22, name: "Vayakhel-Pekudei", heb: "וַיַּקְהֵל-פְּקוּדֵי", ref: "Êx 35:1–40:38",
    haftara: "2 Reis 11:17–12:17 + 1 Reis 7:51–8:21",
    brit: "João 1:14-18",
    theme: "A construção, conclusão e dedicação do Mishkan",
    dataDiaspora: "2026-03-14", dataIsrael: null,
    hebrewDate: "25 Adar 5786", book: "Shemot",
    double: true, nota: "Porção dupla",
  },
  // ── VAYIKRA / Levítico ──
  {
    num: 24, name: "Vayikra", heb: "וַיִּקְרָא", ref: "Lv 1:1–5:26",
    haftara: "Isaías 43:21–44:23",
    brit: "Hebreus 10:1-14",
    theme: "Deus chama Moshe e instrui sobre os sacrifícios e ofrendas",
    dataDiaspora: "2026-03-21", dataIsrael: null,
    hebrewDate: "3 Nissan 5786", book: "Vayikra",
    nota: "Shabat HaGadol — Haftará: Malaquias 3:4-24",
  },
  {
    num: 25, name: "Tzav", heb: "צַו", ref: "Lv 6:1–8:36",
    haftara: "Jeremias 7:21–8:3; 9:22-23",
    brit: "Hebreus 13:10-16",
    theme: "Leis dos sacerdotes, o fogo perpétuo e a consagração de Aharon",
    dataDiaspora: "2026-03-28", dataIsrael: null,
    hebrewDate: "10 Nissan 5786", book: "Vayikra",
  },
  {
    num: 26, name: "Shemini", heb: "שְּׁמִינִי", ref: "Lv 9:1–11:47",
    haftara: "2 Samuel 6:1–7:17",
    brit: "Atos 10:9-16",
    theme: "A inauguração do Tabernáculo, a morte de Nadav e Avihu, as leis alimentares",
    dataDiaspora: "2026-04-11", dataIsrael: null,
    hebrewDate: "24 Nissan 5786", book: "Vayikra",
    nota: "Após Pessach — semana de Pessach interrompe o ciclo",
  },
  {
    num: 27, name: "Tazria-Metzora", heb: "תַזְרִיעַ-מְּצֹרָע", ref: "Lv 12:1–15:33",
    haftara: "2 Reis 4:42–5:19 + 2 Reis 7:3-20",
    brit: "Marcos 1:40-45",
    theme: "Leis de pureza após o parto, tsaraat (lepra) e sua purificação",
    dataDiaspora: "2026-04-18", dataIsrael: null,
    hebrewDate: "1 Iyar 5786", book: "Vayikra",
    double: true, nota: "Porção dupla",
  },
  {
    num: 29, name: "Acharei Mot-Kedoshim", heb: "אַחֲרֵי מוֹת-קְדֹשִׁים", ref: "Lv 16:1–20:27",
    haftara: "Ezequiel 22:1-16 + Amós 9:7-15",
    brit: "Hebreus 9:23-28; 1 Pedro 1:13-16",
    theme: "O serviço de Yom Kippur e a lei da santidade: \"Sede santos!\"",
    dataDiaspora: "2026-04-25", dataIsrael: null,
    hebrewDate: "8 Iyar 5786", book: "Vayikra",
    double: true, nota: "Porção dupla",
  },
  {
    num: 31, name: "Emor", heb: "אֱמֹר", ref: "Lv 21:1–24:23",
    haftara: "Ezequiel 44:15-31",
    brit: "Colossenses 2:16-17",
    theme: "Leis dos sacerdotes e as festas do Senhor (Moadim)",
    dataDiaspora: "2026-05-02", dataIsrael: null,
    hebrewDate: "15 Iyar 5786", book: "Vayikra",
  },
  {
    num: 32, name: "Behar-Bechukotai", heb: "בְּהַר-בְּחֻקֹּתַי", ref: "Lv 25:1–27:34",
    haftara: "Jeremias 32:6-27 + Jeremias 16:19–17:14",
    brit: "Lucas 4:16-21",
    theme: "O Shemitá, o Jubileu e as bênçãos e maldições da aliança",
    dataDiaspora: "2026-05-09", dataIsrael: null,
    hebrewDate: "22 Iyar 5786", book: "Vayikra",
    double: true, nota: "Porção dupla",
  },
  // ── BAMIDBAR / Números ──
  {
    num: 34, name: "Bamidbar", heb: "בְּמִדְבַּר", ref: "Nm 1:1–4:20",
    haftara: "Oséias 2:1-22",
    brit: "1 Coríntios 12:12-27",
    theme: "O censo das doze tribos no deserto do Sinai",
    dataDiaspora: "2026-05-16", dataIsrael: null,
    hebrewDate: "29 Iyar 5786", book: "Bamidbar",
    nota: "Antes de Shavuot",
  },
  {
    num: 35, name: "Nasso", heb: "נָשֹׂא", ref: "Nm 4:21–7:89",
    haftara: "Juízes 13:2-25",
    brit: "João 14:15-27",
    theme: "Deveres dos Levitas, a lei da Sotá, o Nazireu e a bênção sacerdotal",
    dataDiaspora: "2026-05-30", dataIsrael: null,
    hebrewDate: "14 Sivan 5786", book: "Bamidbar",
    nota: "Após Shavuot — a festa interrompe o ciclo",
  },
  {
    num: 36, name: "Beha'alotcha", heb: "בְּהַעֲלֹתְךָ", ref: "Nm 8:1–12:16",
    haftara: "Zacarias 2:14–4:7",
    brit: "João 8:12",
    theme: "A Menorá, a partida do Sinai, as codornizes e a lepra de Miriam",
    dataDiaspora: "2026-06-06", dataIsrael: null,
    hebrewDate: "21 Sivan 5786", book: "Bamidbar",
  },
  {
    num: 37, name: "Shelach", heb: "שְׁלַח", ref: "Nm 13:1–15:41",
    haftara: "Josué 2:1-24",
    brit: "Hebreus 3:7-19",
    theme: "Os doze espias, o relatório negativo e 40 anos no deserto",
    dataDiaspora: "2026-06-13", dataIsrael: null,
    hebrewDate: "28 Sivan 5786", book: "Bamidbar",
  },
  {
    // Diáspora: Korach sozinho em 20/06 | Israel: Korach em 13/06
    num: 38, name: "Korach", heb: "קֹרַח", ref: "Nm 16:1–18:32",
    haftara: "1 Samuel 11:14–12:22",
    brit: "Judas 1:8-11",
    theme: "A rebelião de Korach e dos 250 líderes contra Moshe e Aharon",
    dataDiaspora: "2026-06-20", dataIsrael: "2026-06-13",
    hebrewDate: "5 Tamuz 5786", book: "Bamidbar",
    diffIsrael: true,
  },
  {
    // Diáspora: Chukat-Balak juntos em 27/06 | Israel: Chukat em 20/06, Balak em 27/06
    num: 39, name: "Chukat-Balak", heb: "חֻקַּת-בָּלָק", ref: "Nm 19:1–25:9",
    haftara: "Juízes 11:1-33 + Miquéias 5:6–6:8",
    brit: "João 3:14-15",
    theme: "A vaca vermelha, morte de Miriam, a cobra de bronze e a história de Bileão",
    dataDiaspora: "2026-06-27", dataIsrael: null,
    hebrewDate: "12 Tamuz 5786", book: "Bamidbar",
    double: true,
    israelReading: { name: "Chukat", heb: "חֻקַּת", ref: "Nm 19:1–22:1", haftara: "Juízes 11:1-33", date: "2026-06-20" },
    israelReading2: { name: "Balak", heb: "בָּלָק", ref: "Nm 22:2–25:9", haftara: "Miquéias 5:6–6:8", date: "2026-06-27" },
    diffIsrael: true,
    nota: "Diáspora: porção dupla | Israel: Chukat (20/06) e Balak (27/06) separados",
  },
  {
    num: 41, name: "Pinchas", heb: "פִּינְחָס", ref: "Nm 25:10–30:1",
    haftara: "1 Reis 18:46–19:21",
    brit: "João 2:13-17",
    theme: "O zelo de Pinchas, novo censo e as festas do calendário sagrado",
    dataDiaspora: "2026-07-04", dataIsrael: null,
    hebrewDate: "19 Tamuz 5786", book: "Bamidbar",
  },
  {
    num: 42, name: "Matot-Masei", heb: "מַּטּוֹת-מַסְעֵי", ref: "Nm 30:2–36:13",
    haftara: "Jeremias 1:1–2:3 + Jeremias 2:4–28; 3:4",
    brit: "Mateus 5:33-37",
    theme: "Os votos, as guerras e as 42 etapas da jornada no deserto",
    dataDiaspora: "2026-07-11", dataIsrael: null,
    hebrewDate: "26 Tamuz 5786", book: "Bamidbar",
    double: true, nota: "Porção dupla",
  },
  // ── DEVARIM / Deuteronômio ──
  {
    num: 44, name: "Devarim", heb: "דְּבָרִים", ref: "Dt 1:1–3:22",
    haftara: "Isaías 1:1-27",
    brit: "Atos 7:44-50",
    theme: "O discurso final de Moshe começa — revisão da história de Israel",
    dataDiaspora: "2026-07-18", dataIsrael: null,
    hebrewDate: "4 Av 5786", book: "Devarim",
    nota: "Shabat Chazon — véspera de Tisha B'Av",
  },
  {
    num: 45, name: "Va'etchanan", heb: "וָאֶתְחַנַּן", ref: "Dt 3:23–7:11",
    haftara: "Isaías 40:1-26",
    brit: "Marcos 12:28-34",
    theme: "Moshe ora para entrar na terra; o Shema e os Dez Mandamentos repetidos",
    dataDiaspora: "2026-07-25", dataIsrael: null,
    hebrewDate: "11 Av 5786", book: "Devarim",
    nota: "Shabat Nachamu — primeiro Shabat de consolação após Tisha B'Av",
  },
  {
    num: 46, name: "Eikev", heb: "עֵקֶב", ref: "Dt 7:12–11:25",
    haftara: "Isaías 49:14–51:3",
    brit: "Mateus 4:1-11",
    theme: "A recompensa da obediência e o perigo do orgulho",
    dataDiaspora: "2026-08-01", dataIsrael: null,
    hebrewDate: "18 Av 5786", book: "Devarim",
  },
  {
    num: 47, name: "Re'eh", heb: "רְאֵה", ref: "Dt 11:26–16:17",
    haftara: "Isaías 54:11–55:5",
    brit: "Mateus 7:13-14",
    theme: "\"Vê! Ponho diante de ti bênção e maldição\" — lei do lugar central",
    dataDiaspora: "2026-08-08", dataIsrael: null,
    hebrewDate: "25 Av 5786", book: "Devarim",
  },
  {
    num: 48, name: "Shoftim", heb: "שֹׁפְטִים", ref: "Dt 16:18–21:9",
    haftara: "Isaías 51:12–52:12",
    brit: "Atos 3:19-23",
    theme: "Juízes, reis, sacerdotes, profetas e as leis de guerra",
    dataDiaspora: "2026-08-15", dataIsrael: null,
    hebrewDate: "2 Elul 5786", book: "Devarim",
    aliyot: [
      "Dt 16:18–17:13", "Dt 17:14–17:20", "Dt 18:1–18:5",
      "Dt 18:6–18:14", "Dt 18:15–19:13", "Dt 19:14–20:9",
      "Dt 20:10–21:9",
    ],
  },
  {
    num: 49, name: "Ki Teitzei", heb: "כִּי-תֵצֵא", ref: "Dt 21:10–25:19",
    haftara: "Isaías 54:1-10",
    brit: "Gálatas 3:10-14",
    theme: "74 mitzvot sobre família, propriedade e vida em comunidade",
    dataDiaspora: "2026-08-22", dataIsrael: null,
    hebrewDate: "9 Elul 5786", book: "Devarim",
    aliyot: [
      "Dt 21:10–21:21", "Dt 21:22–22:7", "Dt 22:8–23:7",
      "Dt 23:8–23:24", "Dt 23:25–24:4", "Dt 24:5–24:13",
      "Dt 24:14–25:19",
    ],
  },
  {
    num: 50, name: "Ki Tavo", heb: "כִּי-תָבוֹא", ref: "Dt 26:1–29:8",
    haftara: "Isaías 60:1-22",
    brit: "Romanos 10:6-10",
    theme: "As primícias, a Vidui Bikkurim e as bênçãos e maldições na terra",
    dataDiaspora: "2026-08-29", dataIsrael: null,
    hebrewDate: "16 Elul 5786", book: "Devarim",
  },
  {
    num: 51, name: "Nitzavim-Vayelech", heb: "נִצָּבִים-וַיֵּלֶךְ", ref: "Dt 29:9–31:30",
    haftara: "Isaías 61:10–63:9 + Oséias 14:2-10; Joel 2:15-27",
    brit: "Romanos 10:1-13",
    theme: "\"Escolhe a vida!\" — Moshe encoraja o povo e escreve a Torá",
    dataDiaspora: "2026-09-05", dataIsrael: null,
    hebrewDate: "23 Elul 5786", book: "Devarim",
    double: true, nota: "Porção dupla — último Shabat antes de Rosh Hashaná 5787",
  },
  // ── INÍCIO 5787 ──
  {
    num: 53, name: "Ha'azinu", heb: "הַאֲזִינוּ", ref: "Dt 32:1–52",
    haftara: "2 Samuel 22:1-51",
    brit: "Apocalipse 15:1-4",
    theme: "O grande cântico de Moshe — testemunho poético da história de Israel",
    dataDiaspora: "2026-09-19", dataIsrael: null,
    hebrewDate: "4 Tishrei 5787", book: "Devarim",
    nota: "Shabat Shuva — entre Rosh Hashaná e Yom Kippur 5787",
  },
  {
    num: 54, name: "V'Zot HaBracha", heb: "וְזֹאת הַבְּרָכָה", ref: "Dt 33:1–34:12",
    haftara: "Josué 1:1-18",
    brit: "Mateus 17:1-9",
    theme: "A última bênção de Moshe às tribos e sua morte no Monte Nebo",
    dataDiaspora: "2026-10-03", dataIsrael: null,
    hebrewDate: "23 Tishrei 5787", book: "Devarim",
    nota: "Simchat Torah — lida na festa, não no Shabat regular",
  },
];

// ─── LEITURA DE SHABAT ESPECIAL (festas e shabatot especiais) ─────────────────
const SHABATOT_ESPECIAIS = [
  { name: "Shabat Bereshit", date: "2025-10-18", nota: "Início do novo ciclo anual 5786" },
  { name: "Shabat Chanukah", date: "2025-12-20", nota: "Leitura adicional: Nm 7:42-47" },
  { name: "Shabat Shekalim", date: "2026-02-14", nota: "Leitura adicional: Êx 30:11-16" },
  { name: "Shabat Zachor", date: "2026-02-28", nota: "Leitura adicional: Dt 25:17-19 (antes de Purim)" },
  { name: "Shabat Parah", date: "2026-03-07", nota: "Leitura adicional: Nm 19:1-22" },
  { name: "Shabat HaGadol", date: "2026-03-21", nota: "O Grande Shabat antes de Pessach — Haftará: Malaquias 3:4-24" },
  { name: "Shabat Shirah", date: "2026-01-31", nota: "Shabat do Cântico do Mar (Beshalach)" },
  { name: "Shabat Nachamu", date: "2026-07-25", nota: "Shabat de Consolação após Tisha B'Av — Haftará: Isaías 40:1-26" },
  { name: "Shabat Chazon", date: "2026-07-18", nota: "Shabat da Visão — véspera de Tisha B'Av" },
  { name: "Shabat Shuva", date: "2026-09-19", nota: "Shabat do Retorno — entre Rosh Hashaná e Yom Kippur" },
];

// ─── HELPER: encontrar parasha pela data ──────────────────────────────────────
function getParashaByDate(dateStr) {
  // Encontra a parasha mais próxima anterior ou igual à data fornecida
  const target = new Date(dateStr);
  let best = null;
  for (const p of PARASHOT_5786) {
    const pd = new Date(p.dataDiaspora);
    if (pd <= target) {
      if (!best || pd > new Date(best.dataDiaspora)) best = p;
    }
  }
  return best;
}

// Aproxima a Parashat correspondente a uma data de nascimento (qualquer ano),
// mapeando o mês/dia gregoriano para o ciclo de leituras do ano 5786 (2025-2026),
// já que o calendário de Parashot só está disponível para esse ciclo.
// Retorna a porção diária (aliá) da parashá atual, seguindo o sistema
// tradicional de estudo diário (Chitas): Domingo = 1ª aliá, Segunda = 2ª,
// ..., Sábado = 7ª aliá — assim, ao ler uma pequena parte por dia,
// completa-se a leitura de toda a Parashat HaShavua até o Shabat.
function getDailyPortion(parasha, lang = "pt") {
  if (!parasha) return null;
  const dayIdx = getHebrewCivilDate().getDay(); // 0=Dom ... 6=Sáb — já ajustado para virar às 18h
  const aliyahNum = dayIdx + 1;       // 1=Dom ... 7=Sáb
  const hasData = Array.isArray(parasha.aliyot) && parasha.aliyot[dayIdx];
  const weekdaysLoc = getWeekdays(lang);
  return {
    dayIdx,
    aliyahNum,
    weekdayName: weekdaysLoc[dayIdx],
    ref: hasData ? parasha.aliyot[dayIdx] : null,
  };
}

function getParashaForBirthday(month, day) {
  const year = month >= 10 ? 2025 : 2026; // cobre Out/Nov/Dez 2025 e Jan-Set 2026
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return getParashaByDate(dateStr);
}

function getCurrentParasha() {
  // Usa dia hebraico ajustado: após 18h de sexta, o Shabat já começou
  const now     = new Date();
  const hebNow  = getHebrewCivilDate(); // D+1 se após 18h
  const dayOfWeek = now.getDay();

  // Se for após 18h de sexta (5), o Shabat já começou → usa sábado hebraico
  // Se for após 18h de sábado (6), o Shabat já terminou → busca próxima semana
  let nextSat = new Date(hebNow);
  const hebDay = hebNow.getDay();
  const daysUntilSat = (6 - hebDay + 7) % 7;
  nextSat.setDate(hebNow.getDate() + daysUntilSat);

  let best = null;
  for (const p of PARASHOT_5786) {
    const pd = new Date(p.dataDiaspora);
    if (pd <= nextSat) {
      if (!best || pd > new Date(best.dataDiaspora)) best = p;
    }
  }
  return best || PARASHOT_5786[0];
}

function getNextParasha() {
  const current = getCurrentParasha();
  const idx = PARASHOT_5786.findIndex(p => p.name === current.name);
  return PARASHOT_5786[Math.min(idx + 1, PARASHOT_5786.length - 1)];
}

// ─── VERSÍCULOS DIÁRIOS ───────────────────────────────────────────────────────
const DAILY_VERSES = [
  { ref:"Gênesis 1:1",         heb:"בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",           pt:"No princípio, Deus criou os céus e a terra." },
  { ref:"Salmos 23:1",         heb:"יְהוָה רֹעִי לֹא אֶחְסָר",                                               pt:"O Senhor é o meu pastor; nada me faltará." },
  { ref:"Josué 1:9",           heb:"חֲזַק וֶאֱמָץ אַל תַּעֲרֹץ וְאַל תֵּחָת",                              pt:"Sê forte e corajoso! Não te apavores, pois o Senhor teu Deus está contigo." },
  { ref:"Salmos 119:105",      heb:"נֵר לְרַגְלִי דְבָרֶךָ וְאוֹר לִנְתִיבָתִי",                            pt:"Lâmpada para os meus pés é a tua palavra e luz para o meu caminho." },
  { ref:"Isaías 40:31",        heb:"וְקוֹיֵי יְהוָה יַחֲלִיפוּ כֹחַ יַעֲלוּ אֵבֶר כַּנְּשָׁרִים",         pt:"Os que esperam no Senhor renovam as forças, sobem com asas como águias." },
  { ref:"Jeremias 29:11",      heb:"כִּי אָנֹכִי יָדַעְתִּי אֶת הַמַּחֲשָׁבֹת אֲשֶׁר אָנֹכִי חֹשֵׁב עֲלֵיכֶם", pt:"Porque eu sei os planos que tenho para vocês, planos de paz e não de mal." },
  { ref:"Provérbios 3:5-6",    heb:"בְּטַח אֶל יְהוָה בְּכָל לִבֶּךָ וְאֶל בִּינָתְךָ אַל תִּשָּׁעֵן",    pt:"Confia no Senhor de todo o teu coração e não te apoies no teu próprio entendimento." },
  { ref:"Salmos 46:10",        heb:"הַרְפּוּ וּדְעוּ כִּי אָנֹכִי אֱלֹהִים",                                pt:"Aquietai-vos e sabei que eu sou Deus." },
  { ref:"Deuteronômio 6:4",    heb:"שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד",                    pt:"Ouve, ó Israel: o Senhor nosso Deus é o único Senhor." },
  { ref:"Números 6:24-26",     heb:"יְבָרֶכְךָ יְהוָה וְיִשְׁמְרֶךָ יָאֵר יְהוָה פָּנָיו אֵלֶיךָ",        pt:"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti." },
  { ref:"Salmos 1:1-2",        heb:"אַשְׁרֵי הָאִישׁ אֲשֶׁר לֹא הָלַךְ בַּעֲצַת רְשָׁעִים",                pt:"Bem-aventurado o homem que não anda no conselho dos ímpios e se deleita na lei do Senhor." },
  { ref:"Isaías 41:10",        heb:"אַל תִּירָא כִּי עִמְּךָ אָנִי",                                         pt:"Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus." },
  { ref:"Salmos 27:1",         heb:"יְהוָה אוֹרִי וְיִשְׁעִי מִמִּי אִירָא",                                pt:"O Senhor é a minha luz e a minha salvação; a quem temerei?" },
  { ref:"Êxodo 15:2",          heb:"עָזִּי וְזִמְרָת יָהּ וַיְהִי לִי לִישׁוּעָה",                          pt:"O Senhor é a minha força e o meu cântico, e se tornou a minha salvação." },
  { ref:"Salmos 103:1",        heb:"בָּרֲכִי נַפְשִׁי אֶת יְהוָה וְכָל קְרָבַי אֶת שֵׁם קָדְשׁוֹ",         pt:"Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome." },
  { ref:"Miquéias 6:8",        heb:"הִגִּיד לְךָ אָדָם מַה טּוֹב וּמָה יְהוָה דּוֹרֵשׁ מִמְּךָ",            pt:"Ele te declarou, ó homem, o que é bom; e que é o que o Senhor pede de ti?" },
  { ref:"Salmos 34:8",         heb:"טַעֲמוּ וּרְאוּ כִּי טוֹב יְהוָה",                                       pt:"Provai e vede que o Senhor é bom; bem-aventurado o homem que nele confia." },
  { ref:"2 Crônicas 7:14",     heb:"וְיִכָּנְעוּ עַמִּי אֲשֶׁר נִקְרָא שְׁמִי עֲלֵיהֶם",                    pt:"Se o meu povo, que se chama pelo meu nome, se humilhar e orar, eu ouvirei." },
  { ref:"Salmos 37:4",         heb:"וְהִתְעַנַּג עַל יְהוָה וְיִתֶּן לְךָ מִשְׁאֲלֹת לִבֶּךָ",               pt:"Deleita-te também no Senhor, e ele te concederá os desejos do teu coração." },
  { ref:"Provérbios 16:3",     heb:"גֹּל אֶל יְהוָה מַעֲשֶׂיךָ וְיִכֹּנוּ מַחְשְׁבֹתֶיךָ",                  pt:"Confia ao Senhor as tuas obras, e os teus pensamentos serão estabelecidos." },
  { ref:"Salmos 91:1",         heb:"יֹשֵׁב בְּסֵתֶר עֶלְיוֹן בְּצֵל שַׁדַּי יִתְלוֹנָן",                    pt:"Aquele que habita no abrigo do Altíssimo, à sombra do Todo-Poderoso descansará." },
  { ref:"Isaías 26:3",         heb:"יֵצֶר סָמוּךְ תִּצֹּר שָׁלוֹם שָׁלוֹם כִּי בְךָ בָּטוּחַ",              pt:"Tu, Senhor, conservarás em paz perfeita aquele cujos pensamentos estão fixos em ti." },
  { ref:"Lamentações 3:22-23", heb:"חַסְדֵי יְהוָה כִּי לֹא תָמְנוּ כִּי לֹא כָלוּ רַחֲמָיו",               pt:"As misericórdias do Senhor nunca chegam ao fim; as suas compaixões jamais se esgotam." },
  { ref:"Salmos 16:8",         heb:"שִׁוִּיתִי יְהוָה לְנֶגְדִּי תָמִיד",                                     pt:"Tenho o Senhor sempre diante de mim; porque está à minha direita, não serei abalado." },
  { ref:"Habacuque 3:17-18",   heb:"וַאֲנִי בַּיהוָה אֶעֱלֹוזָה אָגִילָה בֵּאלֹהֵי יִשְׁעִי",                pt:"Ainda assim me alegrarei no Senhor e me regozijarei no Deus da minha salvação." },
  { ref:"Salmos 121:1-2",      heb:"אֶשָּׂא עֵינַי אֶל הֶהָרִים מֵאַיִן יָבֹא עֶזְרִי",                      pt:"Elevo os meus olhos para os montes — de onde me virá o socorro? O meu socorro vem do Senhor." },
  { ref:"Rute 1:16",           heb:"כִּי אֶל אֲשֶׁר תֵּלְכִי אֵלֵךְ",                                        pt:"Para onde tu fordes, irei eu; onde tu pousares, ali pousarei eu; o teu povo é o meu povo." },
  { ref:"Ester 4:14",          heb:"וּמִי יוֹדֵעַ אִם לְעֵת כָּזֹאת הִגַּעַתְּ לַמַּלְכוּת",                 pt:"Quem sabe se não foi precisamente para uma ocasião como esta que chegaste à posição de rainha?" },
  { ref:"Daniel 6:23",         heb:"כָּל קֳבֵל דִּי הֵימִן בֵּאלָהֵהּ",                                        pt:"Nenhum ferimento foi encontrado nele, porque havia confiado no seu Deus." },
  { ref:"Salmos 150:6",        heb:"כֹּל הַנְּשָׁמָה תְּהַלֵּל יָהּ הַלְלוּיָהּ",                             pt:"Tudo o que tem fôlego louve ao Senhor! Aleluia!" },
];

// ─── HORA HEBRAICA ────────────────────────────────────────────────────────────
// No calendário hebraico, o novo dia começa ao pôr do sol (~18:00).
// Após 18h, já estamos no "próximo dia hebraico".
// SUNSET_HOUR pode ser ajustado para o horário real de pôr do sol local.
const HEBREW_DAY_START_HOUR = 18; // 18:00 = início do novo dia hebraico

/**
 * Retorna a "data hebraica civil" atual.
 * Se for após 18:00, avança um dia gregoriano (pois o dia hebraico já mudou).
 */
function getHebrewCivilDate() {
  const now = new Date();
  const adjusted = new Date(now);
  if (now.getHours() >= HEBREW_DAY_START_HOUR) {
    // Após 18h → já é o próximo dia hebraico
    adjusted.setDate(adjusted.getDate() + 1);
  }
  return adjusted;
}

/**
 * Verifica se agora está no período de transição (entre 18h e meia-noite),
 * ou seja, o dia gregoriano ainda não mudou mas o hebraico já mudou.
 */
function isHebrewTransitionPeriod() {
  const now = new Date();
  return now.getHours() >= HEBREW_DAY_START_HOUR;
}

function getDailyVerse() {
  // Usa o dia hebraico ajustado para selecionar o versículo
  const ref = getHebrewCivilDate();
  const start = new Date(ref.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((ref - start) / 86400000);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

// ─── ROSH CHODESH & FASE LUNAR ────────────────────────────────────────────────
const ROSH_CHODESH_5786 = [
  { month:"Tishrei",  heb:"תִּשְׁרֵי",  date:"2025-09-23", note:"Rosh Hashaná — início do ano civil" },
  { month:"Cheshvan", heb:"חֶשְׁוָן",   date:"2025-10-23", note:"Mês sem festas — chuvas de inverno" },
  { month:"Kislev",   heb:"כִּסְלֵו",   date:"2025-11-21", note:"Véspera de Chanukah" },
  { month:"Tevet",    heb:"טֵבֵת",      date:"2025-12-21", note:"Continuação de Chanukah" },
  { month:"Shevat",   heb:"שְׁבָט",     date:"2026-01-20", note:"Preparação para Tu BiShvat" },
  { month:"Adar",     heb:"אֲדָר",      date:"2026-02-18", note:"Mês de Purim" },
  { month:"Nissan",   heb:"נִיסָן",     date:"2026-03-20", note:"Primeiro mês bíblico — Pessach" },
  { month:"Iyar",     heb:"אִיָּר",     date:"2026-04-19", note:"Contagem do Omer" },
  { month:"Sivan",    heb:"סִיוָן",     date:"2026-05-19", note:"Mês de Shavuot" },
  { month:"Tammuz",   heb:"תַּמּוּז",   date:"2026-06-17", note:"Início do período de jejum" },
  { month:"Av",       heb:"אָב",        date:"2026-07-17", note:"Mês de Tisha B'Av" },
  { month:"Elul",     heb:"אֱלוּל",     date:"2026-08-15", note:"Mês de teshuvá — preparação" },
  { month:"Tishrei",  heb:"תִּשְׁרֵי",  date:"2026-09-13", note:"Rosh Hashaná 5787" },
];

function getNextRoshChodesh() {
  // Após 18h, o dia hebraico já mudou — usa o dia seguinte como referência
  const ref = getHebrewCivilDate();
  ref.setHours(0, 0, 0, 0);
  for (const rc of ROSH_CHODESH_5786) {
    const d = new Date(rc.date);
    d.setHours(0, 0, 0, 0);
    if (d >= ref) return rc;
  }
  return ROSH_CHODESH_5786[ROSH_CHODESH_5786.length - 1];
}

function getMoonPhase(date = getHebrewCivilDate()) {
  const KNOWN_NEW_MOON = new Date("2025-09-23T00:00:00Z");
  const CYCLE = 29.530588853;
  const diffDays = (date - KNOWN_NEW_MOON) / 86400000;
  const phase = ((diffDays % CYCLE) + CYCLE) % CYCLE;
  return phase;
}

function getMoonEmoji(phase) {
  if (phase < 1.85)  return "🌑";
  if (phase < 7.38)  return "🌒";
  if (phase < 11.08) return "🌓";
  if (phase < 14.77) return "🌔";
  if (phase < 16.62) return "🌕";
  if (phase < 22.15) return "🌖";
  if (phase < 25.85) return "🌗";
  return "🌘";
}

function getMoonPhaseName(phase) {
  if (phase < 1.85)  return "Lua Nova (Rosh Chodesh)";
  if (phase < 7.38)  return "Lua Crescente";
  if (phase < 11.08) return "Quarto Crescente";
  if (phase < 14.77) return "Gibosa Crescente";
  if (phase < 16.62) return "Lua Cheia";
  if (phase < 22.15) return "Gibosa Minguante";
  if (phase < 25.85) return "Quarto Minguante";
  return "Lua Minguante";
}

// ─── HEBREW DATE CONVERSION ───────────────────────────────────────────────────

function getMonthIndexFromName(name) {
  const map = {
    Tishri: 6, Tishrei: 6, Heshvan: 7, Cheshvan: 7, Marcheshvan: 7,
    Kislev: 8, Tevet: 9, Teveth: 9, Shevat: 10, Shvat: 10,
    Adar: 11, "Adar I": 11, "Adar II": 12,
    Nisan: 0, Nissan: 0, Iyar: 1, Sivan: 2,
    Tamuz: 3, Tammuz: 3, Av: 4, Ab: 4, Elul: 5,
  };
  for (const [k, v] of Object.entries(map)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return 0;
}

function gregorianToHebrew(gYear, gMonth, gDay) {
  const date = new Date(gYear, gMonth - 1, gDay);
  const hebrewYear = parseInt(
    new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric" }).format(date).replace(/\D/g, "")
  );
  const hebrewMonthStr = new Intl.DateTimeFormat("en-u-ca-hebrew", { month: "long" }).format(date);
  const hebrewDay = parseInt(
    new Intl.DateTimeFormat("en-u-ca-hebrew", { day: "numeric" }).format(date)
  );
  const monthIndex = getMonthIndexFromName(hebrewMonthStr);
  const monthInfo = HEBREW_MONTHS[monthIndex] || HEBREW_MONTHS[0];
  return { year: hebrewYear, month: monthIndex + 1, day: hebrewDay, monthName: monthInfo.name, monthNameHeb: monthInfo.heb };
}

function getTodayHebrew() {
  // Após 18h, o dia hebraico já mudou — usa o dia gregoriano seguinte
  const t = getHebrewCivilDate();
  return gregorianToHebrew(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

function getMonthDays(year, month) {
  // "Hoje" no sentido hebraico: após 18h já é o dia seguinte
  const hebrewToday    = getHebrewCivilDate();
  const hebrewTodayDay = new Date(
    hebrewToday.getFullYear(), hebrewToday.getMonth(), hebrewToday.getDate()
  ).getTime();
  const inTransition = isHebrewTransitionPeriod();

  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day  = i + 1;
    const date = new Date(year, month - 1, day);
    const hd   = gregorianToHebrew(year, month, day);
    const feast = BIBLICAL_FEASTS.find(
      f => f.month === hd.month && hd.day >= f.day && hd.day < f.day + f.dur
    ) || null;

    // Marca como "hoje" o dia hebraico vigente (pode ser D+1 após 18h)
    const isToday = date.getTime() === hebrewTodayDay;

    // Se estivermos em período de transição (18h-00h), marca também o dia
    // gregoriano atual como "véspera" para orientação do usuário
    const isErev = inTransition && date.getTime() === new Date(
      new Date().getFullYear(), new Date().getMonth(), new Date().getDate()
    ).getTime();

    return { gregorianDate: date, hebrewDate: hd, isToday, isErev, hasFeast: feast };
  });
}

// ─── SHABAT TIMES ─────────────────────────────────────────────────────────────

function getSunTimes(lat, lng, date) {
  // Cálculo astronômico simplificado de nascente/poente
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const B = (360 / 365) * (dayOfYear - 81) * rad;
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const decl = 23.45 * Math.sin(B) * rad;
  const HA = Math.acos(-Math.tan(lat * rad) * Math.tan(decl)) / rad;
  const timezone = -date.getTimezoneOffset() / 60;
  const noon = 12 - lng / 15 - EoT / 60 + timezone;
  const sunrise = noon - HA / 15;
  const sunset = noon + HA / 15;
  const toHHMM = (h) => {
    const hh = Math.floor(h); const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };
  return { sunrise: toHHMM(sunrise), sunset: toHHMM(sunset) };
}

function getShabatTimes(lat, lng) {
  const now = new Date();
  const friday = new Date(now);
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  friday.setDate(now.getDate() + daysUntilFriday);
  const saturday = new Date(friday); saturday.setDate(friday.getDate() + 1);
  const fri = getSunTimes(lat, lng, friday);
  const sat = getSunTimes(lat, lng, saturday);
  // Candles 18 min before sunset Friday
  const candleTime = (() => {
    const [h, m] = fri.sunset.split(":").map(Number);
    const total = h * 60 + m - 18;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  })();
  // Havdalah 42 min after sunset Saturday (3 stars)
  const havdalahTime = (() => {
    const [h, m] = sat.sunset.split(":").map(Number);
    const total = h * 60 + m + 42;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  })();
  const fmt = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return {
    friday: fmt(friday), saturday: fmt(saturday),
    candles: candleTime, havdalah: havdalahTime,
    sunsetFri: fri.sunset, sunriseSat: sat.sunrise,
  };
}

// ─── UPCOMING FEASTS ──────────────────────────────────────────────────────────

function getUpcomingFeasts(daysAhead = 60) {
  // Ponto de partida = dia hebraico atual (após 18h já é D+1)
  const hebrewStart = getHebrewCivilDate();
  hebrewStart.setHours(0, 0, 0, 0);
  const results = [];
  for (let d = 0; d <= daysAhead; d++) {
    const checkDate = new Date(hebrewStart);
    checkDate.setDate(hebrewStart.getDate() + d);
    const hd = gregorianToHebrew(
      checkDate.getFullYear(), checkDate.getMonth() + 1, checkDate.getDate()
    );
    const feast = BIBLICAL_FEASTS.find(f => f.month === hd.month && hd.day === f.day);
    if (feast) results.push({ feast, date: new Date(checkDate), daysAway: d });
  }
  return results.slice(0, 3);
}

// ─── PREMIUM DESIGN SYSTEM ────────────────────────────────────────────────────
// Inspired by Jerusalem, Menorah, Torah scrolls & Davidic royalty
// App Store / Google Play quality — Cinzel + Inter + Noto Serif Hebrew

const DARK_THEME = {
  // Backgrounds — modern deep indigo
  bg:           "#080B1F",
  bgDeep:       "#050716",
  bgCard:       "rgba(22,28,58,0.72)",
  bgCardHover:  "rgba(30,38,78,0.88)",
  bgGlass:      "rgba(10,14,35,0.55)",
  bgSection:    "rgba(16,22,48,0.82)",
  // Gold — heritage accent
  gold:         "#E9C46A",
  goldLight:    "#F6D98A",
  goldPale:     "#FBEBB8",
  goldBg:       "rgba(233,196,106,0.10)",
  goldBorder:   "rgba(233,196,106,0.24)",
  goldGlow:     "rgba(233,196,106,0.35)",
  // Modern CTA — vibrant indigo/violet
  emerald:      "#7C5CFF",
  emeraldLight: "#9C7BFF",
  emeraldGlow:  "rgba(124,92,255,0.38)",
  orange:       "#F59E0B",
  orangeLight:  "#FBBF24",
  orangeGlow:   "rgba(245,158,11,0.32)",
  // Text
  text:         "#F5F3EE",
  textSub:      "rgba(245,243,238,0.76)",
  textMuted:    "rgba(245,243,238,0.50)",
  textFaint:    "rgba(245,243,238,0.28)",
  // Accents
  blue:         "#141B44",
  blueMid:      "#1E2865",
  blueLight:    "rgba(124,92,255,0.16)",
  accent:       "#7C5CFF",
  // Feast categories
  spring:       "rgba(52,211,153,0.14)",
  fall:         "rgba(251,146,60,0.14)",
  other:        "rgba(167,139,250,0.16)",
  shabat:       "rgba(233,196,106,0.09)",
  today:        "#E9C46A",
  // UI
  navBg:        "rgba(6,9,24,0.92)",
  navBorder:    "rgba(233,196,106,0.14)",
  inputBg:      "rgba(10,14,35,0.72)",
  cardAlt:      "rgba(22,28,58,0.55)",
  divider:      "rgba(233,196,106,0.12)",
  isDark:       true,
};

const LIGHT_THEME = {
  bg:           "#F8F4ED",       // warm parchment cream
  bgDeep:       "#EDE6D8",       // deeper parchment
  bgCard:       "rgba(255,252,247,0.98)",
  bgCardHover:  "rgba(255,255,255,1)",
  bgGlass:      "rgba(248,244,237,0.88)",
  bgSection:    "rgba(255,250,243,0.96)",
  gold:         "#C9A227",
  goldLight:    "#E8C96A",
  goldPale:     "#F8E9B8",
  goldBg:       "rgba(201,162,39,0.10)",
  goldBorder:   "rgba(201,162,39,0.24)",
  goldGlow:     "rgba(201,162,39,0.22)",
  emerald:      "#0D9488",
  emeraldLight: "#14B8A6",
  emeraldGlow:  "rgba(13,148,136,0.20)",
  orange:       "#D97706",
  orangeLight:  "#F59E0B",
  orangeGlow:   "rgba(217,119,6,0.20)",
  text:         "#1E293B",
  textSub:      "rgba(30,41,59,0.78)",
  textMuted:    "rgba(30,41,59,0.55)",
  textFaint:    "rgba(30,41,59,0.30)",
  blue:         "#1E3A5F",
  blueMid:      "#2E6FA8",
  blueLight:    "rgba(30,58,95,0.08)",
  accent:       "#2E6FA8",
  spring:       "rgba(13,148,136,0.10)",
  fall:         "rgba(217,119,6,0.10)",
  other:        "rgba(124,58,237,0.09)",
  shabat:       "rgba(201,162,39,0.07)",
  today:        "#C9A227",
  navBg:        "rgba(255,252,247,0.97)",
  navBorder:    "rgba(201,162,39,0.12)",
  inputBg:      "rgba(255,252,247,0.98)",
  cardAlt:      "rgba(237,230,216,0.75)",
  divider:      "rgba(30,41,59,0.08)",
  isDark:       false,
};

let S = { ...DARK_THEME };

// ─── HELPERS DE COR REATIVOS AO TEMA ───────────────────────────────────────
// Vários painéis internos usavam fundos "tinta profunda" (azul-marinho) fixos,
// que não mudavam no tema claro — resultando em texto escuro sobre fundo
// escuro (baixo contraste). Estas funções resolvem isso, adaptando o tom de
// fundo conforme o tema ativo, preservando a legibilidade em ambos os modos.
function ink(alpha = 1) {
  return S.isDark ? `rgba(4,16,46,${alpha})` : `rgba(255,253,248,${alpha})`;
}
function inkMid(alpha = 1) {
  return S.isDark ? `rgba(22,39,84,${alpha})` : `rgba(234,226,212,${alpha})`;
}

function buildCSS(theme) {
  const isDark = theme.isDark;
  return `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Noto+Serif+Hebrew:wght@300;400;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }

    body {
      background: ${theme.bg};
      color: ${theme.text};
      font-family: 'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      transition: background 0.4s ease, color 0.4s ease;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${theme.goldBorder}; border-radius: 2px; }

    /* Font classes */
    .jakarta   { font-family: 'Space Grotesk', 'Inter', sans-serif; letter-spacing: -0.01em; }
    .cinzel    { font-family: 'Cinzel', Georgia, serif; }
    .hebrew    { font-family: 'Noto Serif Hebrew', 'Frank Ruhl Libre', serif; direction: rtl; }
    .inter     { font-family: 'Inter', sans-serif; }

    /* Animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.94); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes pulseRing {
      0%   { box-shadow: 0 0 0 0 ${theme.goldGlow}; }
      70%  { box-shadow: 0 0 0 10px rgba(212,175,55,0); }
      100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
    }
    @keyframes flameDance {
      0%,100% { transform: scaleY(1) rotate(-1deg); }
      50%     { transform: scaleY(1.08) rotate(1deg); }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .fade-up    { animation: fadeUp 0.45s cubic-bezier(.22,.68,0,1.2) both; }
    .fade-in    { animation: fadeIn 0.35s ease both; }
    .scale-in   { animation: scaleIn 0.35s cubic-bezier(.22,.68,0,1.2) both; }
    .slide-down { animation: slideDown 0.3s ease both; }

    /* Premium card hover */
    .p-card {
      transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    }
    .p-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px ${theme.goldBorder};
    }

    /* Gold shimmer text */
    .gold-shimmer {
      background: linear-gradient(90deg, ${theme.gold} 0%, ${theme.goldLight} 40%, ${theme.gold} 60%, ${theme.goldLight} 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }

    /* Today pulse */
    .today-ring { animation: pulseRing 2.5s ease infinite; }

    /* Flame */
    .flame { animation: flameDance 1.8s ease-in-out infinite; transform-origin: bottom center; }

    /* Mobile bottom nav */
    @media (max-width: 1099px) {
      .desktop-nav { display: none !important; }
      .mobile-bottom-nav { display: flex !important; }
      body { padding-bottom: 76px; }
    }
    @media (min-width: 1100px) {
      .mobile-bottom-nav { display: none !important; }
    }

    /* Date input */
    input[type="date"] { color-scheme: ${isDark ? "dark" : "light"}; }
    input[type="date"]::-webkit-calendar-picker-indicator {
      filter: ${isDark ? "invert(0.8) sepia(0.5)" : "none"};
      opacity: 0.7;
    }

    /* Tap highlight */
    * { -webkit-tap-highlight-color: rgba(212,175,55,0.15); }

    /* Focus */
    button:focus-visible, input:focus-visible {
      outline: 2px solid ${theme.gold};
      outline-offset: 2px;
    }
  `;
}

const globalCSS = buildCSS(DARK_THEME);

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// ─── SVG ICON LIBRARY ──────────────────────────────────────────────────────────
// Consistent vector icons — no emojis in critical UI

function Icon({ name, size = 20, color, strokeWidth = 1.6 }) {
  const c = color || S.gold;
  const s = { width: size, height: size, flexShrink: 0 };
  const paths = {
    calendar: <><rect x="3" y="4" width="18" height="18" rx="3" ry="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    convert:  <><path d="M7 16V4m0 0L4 7m3-3l3 3"/><path d="M17 8v12m0 0l3-3m-3 3l-3-3"/></>,
    scroll:   <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    candle:   <><path d="M12 2c0 0-2 3-2 6s2 4 2 4 2-1 2-4-2-6-2-6z"/><rect x="9" y="12" width="6" height="10" rx="1"/></>,
    star:     <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    moon:     <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    book:     <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    bell:     <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    share:    <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    copy:     <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    sun:      <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    chevL:    <><polyline points="15 18 9 12 15 6"/></>,
    chevR:    <><polyline points="9 18 15 12 9 6"/></>,
    chevD:    <><polyline points="6 9 12 15 18 9"/></>,
    chevU:    <><polyline points="18 15 12 9 6 15"/></>,
    locate:   <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    tribe:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    check:    <><polyline points="20 6 9 17 4 12"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  };
  return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ─── PREMIUM SHARED COMPONENTS ─────────────────────────────────────────────────

// Gold divider line
function GoldDivider({ my = 16 }) {
  return (
    <div style={{ margin: `${my}px 0`, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${S.goldBorder})` }} />
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: S.gold, opacity: 0.5 }} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${S.goldBorder}, transparent)` }} />
    </div>
  );
}

// Pill badge
function Badge({ children, color, bg, size = "sm" }) {
  const c = color || S.gold;
  const b = bg    || `${c}18`;
  return (
    <span style={{
      background: b, border: `1px solid ${c}44`, color: c,
      fontSize: size === "xs" ? 9 : 10, fontWeight: 700,
      padding: size === "xs" ? "1px 6px" : "3px 10px",
      borderRadius: 20, letterSpacing: "0.04em",
      display: "inline-flex", alignItems: "center", gap: 3,
      fontFamily: "'Inter', sans-serif",
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// Page title
function PageTitle({ icon, title, heb, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 32, padding: "8px 0" }}>
      {icon && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: S.goldBg, border: `1px solid ${S.goldBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 20px ${S.goldGlow}`,
          }}>
            <Icon name={icon} size={24} color={S.gold} />
          </div>
        </div>
      )}
      <h1 className="cinzel" style={{
        fontSize: 22, fontWeight: 700, letterSpacing: "0.05em",
        color: S.goldLight, marginBottom: heb ? 4 : 0,
        textShadow: `0 0 30px ${S.goldGlow}`,
      }}>{title}</h1>
      {heb && (
        <div className="hebrew" style={{ fontSize: 20, color: S.gold, opacity: 0.85, marginBottom: 4 }}>{heb}</div>
      )}
      {sub && <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.5, maxWidth: 400, margin: "0 auto" }}>{sub}</p>}
    </div>
  );
}

// Glass card
function GlassCard({ children, style = {}, onClick, noPad }) {
  return (
    <div
      className={onClick ? "p-card" : ""}
      onClick={onClick}
      style={{
        background: S.bgCard,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${S.goldBorder}`,
        borderRadius: 20,
        padding: noPad ? 0 : 20,
        boxShadow: S.isDark
          ? "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        overflow: "hidden",
        ...style,
      }}
    >{children}</div>
  );
}

// Inline stat tile
function StatTile({ label, value, sub, color, icon }) {
  const c = color || S.goldLight;
  return (
    <div style={{
      background: S.bgGlass, border: `1px solid ${S.divider}`,
      borderRadius: 16, padding: "14px 16px", textAlign: "center",
    }}>
      {icon && <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <Icon name={icon} size={18} color={c} />
      </div>}
      <div className="cinzel" style={{ fontSize: 28, fontWeight: 700, color: c, lineHeight: 1 }}>{value}</div>
      <div style={{ color: S.textSub, fontSize: 12, fontWeight: 500, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: S.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// Input field
function PInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%", background: S.inputBg,
        border: `1px solid ${S.goldBorder}`, borderRadius: 12,
        padding: "12px 16px", color: S.text, fontSize: 14,
        outline: "none", fontFamily: "'Inter', sans-serif",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocus={e => { e.target.style.borderColor = S.gold; e.target.style.boxShadow = `0 0 0 3px ${S.goldBorder}`; }}
      onBlur={e  => { e.target.style.borderColor = S.goldBorder; e.target.style.boxShadow = "none"; }}
    />
  );
}

// Primary action button
function PButton({ children, onClick, disabled, variant = "primary", icon, fullWidth }) {
  const styles = {
    primary: {
      background: `linear-gradient(135deg, ${S.gold} 0%, ${S.goldLight} 100%)`,
      color: "#0A1B45", border: "none",
      boxShadow: `0 4px 20px ${S.goldGlow}`,
    },
    ghost: {
      background: S.goldBg, color: S.goldLight,
      border: `1px solid ${S.goldBorder}`,
      boxShadow: "none",
    },
    danger: {
      background: "rgba(239,68,68,0.12)", color: "#f87171",
      border: "1px solid rgba(239,68,68,0.3)",
      boxShadow: "none",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: 12, padding: "11px 22px",
        fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s ease", opacity: disabled ? 0.6 : 1,
        fontFamily: "'Inter', sans-serif", letterSpacing: "0.02em",
        width: fullWidth ? "100%" : "auto",
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
    >
      {icon && <Icon name={icon} size={15} color={variant === "primary" ? "#0A1B45" : S.goldLight} strokeWidth={2} />}
      {children}
    </button>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <h2 className="cinzel" style={{ fontSize: 22, fontWeight: 700, color: S.goldLight,
        marginBottom: 6, letterSpacing: "0.04em", textShadow: `0 0 24px ${S.goldGlow}` }}>
        {children}
      </h2>
      {sub && <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

// Legacy alias
function Card({ children, style = {}, onClick }) {
  return <GlassCard style={style} onClick={onClick}>{children}</GlassCard>;
}

// ─── MENORAH LOGO ─────────────────────────────────────────────────────────────

function MenorahLogo({ size = 44, glow = true }) {
  return (
    <img
      src="/moedim-logo.png"
      alt="Moedim360"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(6, size * 0.22),
        objectFit: "cover",
        flexShrink: 0,
        display: "block",
        filter: glow
          ? "drop-shadow(0 6px 18px rgba(212,175,55,0.35)) drop-shadow(0 2px 6px rgba(0,0,0,0.35))"
          : "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
      }}
    />
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

// ─── SISTEMA DE IDIOMAS (i18n) ────────────────────────────────────────────────

const LANGUAGES = [
  { code:"pt", name:"Português",  flag:"🇧🇷", nativeName:"Português" },
  { code:"en", name:"English",    flag:"🇺🇸", nativeName:"English" },
  { code:"es", name:"Español",    flag:"🇪🇸", nativeName:"Español" },
  { code:"fr", name:"Français",   flag:"🇫🇷", nativeName:"Français" },
  { code:"de", name:"Deutsch",    flag:"🇩🇪", nativeName:"Deutsch" },
  { code:"he", name:"עברית",      flag:"🇮🇱", nativeName:"עברית" },
  { code:"ru", name:"Русский",    flag:"🇷🇺", nativeName:"Русский" },
];

const T = {
  // ── Navegação ──────────────────────────────────────
  nav_calendar:   { pt:"Calendário",   en:"Calendar",   es:"Calendario",  fr:"Calendrier",  de:"Kalender",    he:"לוּחַ",          ru:"Календарь" },
  nav_converter:  { pt:"Conversor",    en:"Converter",  es:"Conversor",   fr:"Convertir",   de:"Konverter",   he:"המרה",           ru:"Конвертер" },
  nav_parasha:    { pt:"Parashah",     en:"Parashah",   es:"Parashah",    fr:"Parashah",    de:"Parashah",    he:"פָּרָשָׁה",      ru:"Парашат" },
  nav_shabat:     { pt:"Shabat",       en:"Shabbat",    es:"Shabat",      fr:"Shabbat",     de:"Schabbat",    he:"שַׁבָּת",        ru:"Шаббат" },
  nav_feasts:     { pt:"Festas",       en:"Feasts",     es:"Fiestas",     fr:"Fêtes",       de:"Feste",       he:"מוֹעֲדִים360",     ru:"Праздники" },
  nav_moon:       { pt:"Lua Nova",     en:"New Moon",   es:"Luna Nueva",  fr:"Nouvelle Lune",de:"Neumond",    he:"רֹאשׁ חֹדֶשׁ",  ru:"Новолуние" },
  nav_verse:      { pt:"Versículo",    en:"Verse",      es:"Versículo",   fr:"Verset",      de:"Vers",        he:"פָּסוּק",        ru:"Стих" },
  nav_learn:      { pt:"Aprender",     en:"Learn",      es:"Aprender",    fr:"Apprendre",   de:"Lernen",      he:"לִלְמֹד",       ru:"Учиться" },
  nav_settings:   { pt:"Config.",      en:"Settings",   es:"Config.",     fr:"Paramètres",  de:"Einstellungen",he:"הגדרות",       ru:"Настройки" },
  more:           { pt:"Mais",         en:"More",       es:"Más",         fr:"Plus",        de:"Mehr",        he:"עוֹד",           ru:"Ещё" },
  // ── Geral ──────────────────────────────────────────
  today:          { pt:"Hoje",         en:"Today",      es:"Hoy",         fr:"Aujourd'hui", de:"Heute",       he:"הַיּוֹם",        ru:"Сегодня" },
  next:           { pt:"Próximo",      en:"Next",       es:"Próximo",     fr:"Prochain",    de:"Nächste",     he:"הַבָּא",         ru:"Следующий" },
  days:           { pt:"dias",         en:"days",       es:"días",        fr:"jours",       de:"Tage",        he:"יָמִים",         ru:"дней" },
  day:            { pt:"dia",          en:"day",        es:"día",         fr:"jour",        de:"Tag",         he:"יוֹם",           ru:"день" },
  week:           { pt:"semana",       en:"week",       es:"semana",      fr:"semaine",     de:"Woche",       he:"שָׁבוּעַ",       ru:"неделя" },
  month:          { pt:"mês",          en:"month",      es:"mes",         fr:"mois",        de:"Monat",       he:"חֹדֶשׁ",         ru:"месяц" },
  year:           { pt:"ano",          en:"year",       es:"año",         fr:"année",       de:"Jahr",        he:"שָׁנָה",         ru:"год" },
  goToToday:      { pt:"Ir para hoje", en:"Go to today",es:"Ir a hoy",    fr:"Aller à aujourd'hui",de:"Heute",he:"לַיּוֹם",      ru:"На сегодня" },
  // ── Calendário ─────────────────────────────────────
  hebrewCalendar: { pt:"Calendário Bíblico Hebraico", en:"Hebrew Biblical Calendar", es:"Calendario Bíblico Hebreo", fr:"Calendrier Biblique Hébreu", de:"Hebräischer Bibelkalender", he:"הַלּוּחַ הָעִבְרִי", ru:"Еврейский библейский календарь" },
  biblicalFeast:  { pt:"Festa Bíblica", en:"Biblical Feast", es:"Fiesta Bíblica", fr:"Fête Biblique", de:"Biblisches Fest", he:"מוֹעֵד", ru:"Библейский праздник" },
  // ── Shabat ─────────────────────────────────────────
  shabatShalom:   { pt:"Shabat Shalom!",  en:"Shabbat Shalom!", es:"¡Shabat Shalom!", fr:"Chabbat Chalom!", de:"Schabbat Schalom!", he:"שַׁבָּת שָׁלוֹם!", ru:"Шаббат Шалом!" },
  shabatHappening:{ pt:"O Shabat está acontecendo agora. Descanse em Deus.", en:"Shabbat is happening now. Rest in God.", es:"El Shabat está ocurriendo ahora. Descansa en Dios.", fr:"Le Chabbat se déroule maintenant. Reposez-vous en Dieu.", de:"Schabbat findet jetzt statt. Ruhe in Gott.", he:"הַשַּׁבָּת מִתְרַחֵשׁ עַכְשָׁו. נוּחַ בֵּאלֹהִים.", ru:"Шаббат сейчас. Отдыхайте в Боге." },
  nextShabat:     { pt:"Próximo Shabat em", en:"Next Shabbat in", es:"Próximo Shabat en", fr:"Prochain Chabbat dans", de:"Nächster Schabbat in", he:"שַׁבָּת הַבָּא בְּעוֹד", ru:"Следующий Шаббат через" },
  shabatTonight:  { pt:"O Shabat começa hoje ao entardecer", en:"Shabbat begins tonight at sunset", es:"El Shabat comienza esta noche al atardecer", fr:"Le Chabbat commence ce soir au coucher du soleil", de:"Schabbat beginnt heute Abend bei Sonnenuntergang", he:"הַשַּׁבָּת מַתְחִיל הַלַּיְלָה", ru:"Шаббат начинается сегодня вечером" },
  candleLighting: { pt:"Acendimento das velas", en:"Candle lighting", es:"Encendido de velas", fr:"Allumage des bougies", de:"Kerzenanzünden", he:"הַדְלָקַת נֵרוֹת", ru:"Зажигание свечей" },
  sunset:         { pt:"Pôr do sol",  en:"Sunset",    es:"Puesta de sol", fr:"Coucher du soleil", de:"Sonnenuntergang", he:"שְׁקִיעַת חַמָּה", ru:"Закат" },
  sunrise:        { pt:"Nascer do sol", en:"Sunrise", es:"Amanecer",     fr:"Lever du soleil",   de:"Sonnenaufgang",   he:"זְרִיחַת חַמָּה",  ru:"Восход" },
  havdalah:       { pt:"Havdalah",    en:"Havdalah",   es:"Havdalá",      fr:"Havdalah",          de:"Hawdalah",        he:"הַבְדָּלָה",       ru:"Гавдала" },
  useMyLocation:  { pt:"Usar minha localização", en:"Use my location", es:"Usar mi ubicación", fr:"Utiliser ma position", de:"Meinen Standort verwenden", he:"השתמש במיקומי", ru:"Использовать моё местоположение" },
  orSelectCity:   { pt:"ou selecione uma cidade:", en:"or select a city:", es:"o selecciona una ciudad:", fr:"ou choisissez une ville:", de:"oder wähle eine Stadt:", he:"או בחר עיר:", ru:"или выберите город:" },
  locating:       { pt:"Localizando…", en:"Locating…", es:"Localizando…", fr:"Localisation…", de:"Lokalisierung…", he:"מאתר…", ru:"Определение…" },
  locationError:  { pt:"Não foi possível obter a localização. Selecione uma cidade.", en:"Could not get location. Please select a city.", es:"No se pudo obtener la ubicación. Seleccione una ciudad.", fr:"Impossible d'obtenir la position. Veuillez sélectionner une ville.", de:"Standort konnte nicht ermittelt werden. Bitte wähle eine Stadt.", he:"לא ניתן לקבל מיקום. בחר עיר.", ru:"Не удалось получить местоположение. Выберите город." },
  minBeforeSunset:{ pt:"min antes do pôr do sol", en:"min before sunset", es:"min antes del atardecer", fr:"min avant le coucher du soleil", de:"Min. vor Sonnenuntergang", he:"דקות לפני השקיעה", ru:"мин до захода солнца" },
  starsVisible:   { pt:"estrelas visíveis (~42 min)", en:"stars visible (~42 min)", es:"estrellas visibles (~42 min)", fr:"étoiles visibles (~42 min)", de:"Sterne sichtbar (~42 Min.)", he:"כוכבים נראים (~42 דקות)", ru:"звёзды видны (~42 мин)" },
  // ── Parashah ───────────────────────────────────────
  thisWeek:       { pt:"ESTA SEMANA",  en:"THIS WEEK",  es:"ESTA SEMANA", fr:"CETTE SEMAINE", de:"DIESE WOCHE", he:"הַשָּׁבוּעַ", ru:"НА ЭТОЙ НЕДЕЛЕ" },
  nextWeek:       { pt:"PRÓXIMA SEMANA", en:"NEXT WEEK", es:"PRÓXIMA SEMANA", fr:"SEMAINE PROCHAINE", de:"NÄCHSTE WOCHE", he:"שָׁבוּעַ הַבָּא", ru:"СЛЕДУЮЩАЯ НЕДЕЛЯ" },
  torahReading:   { pt:"Torá", en:"Torah", es:"Torá", fr:"Torah", de:"Tora", he:"תּוֹרָה", ru:"Тора" },
  haftarah:       { pt:"Haftará", en:"Haftarah", es:"Haftará", fr:"Haftara", de:"Haftara", he:"הַפְטָרָה", ru:"Гафтара" },
  doublePortion:  { pt:"Porção Dupla", en:"Double Portion", es:"Porción Doble", fr:"Double Portion", de:"Doppelabschnitt", he:"פָּרָשָׁה כְּפוּלָה", ru:"Двойная часть" },
  diffDate:       { pt:"data diferente", en:"different date", es:"fecha diferente", fr:"date différente", de:"anderes Datum", he:"תַּאֲרִיךְ שׁוֹנֶה", ru:"другая дата" },
  // ── Festas ─────────────────────────────────────────
  upcomingFeasts: { pt:"Festas Próximas", en:"Upcoming Feasts", es:"Próximas Fiestas", fr:"Prochaines Fêtes", de:"Bevorstehende Feste", he:"מוֹעֲדִים360 קְרוֹבִים", ru:"Предстоящие праздники" },
  spring:         { pt:"Primavera", en:"Spring", es:"Primavera", fr:"Printemps", de:"Frühling", he:"אָבִיב", ru:"Весна" },
  fall:           { pt:"Outono",    en:"Fall",   es:"Otoño",     fr:"Automne",   de:"Herbst",  he:"סְתָיו",  ru:"Осень" },
  other:          { pt:"Outras",    en:"Other",  es:"Otras",     fr:"Autres",    de:"Andere",  he:"אֲחֵרוֹת", ru:"Другие" },
  // ── Rosh Chodesh ───────────────────────────────────
  newMoon:        { pt:"Lua Nova",    en:"New Moon",   es:"Luna Nueva",   fr:"Nouvelle Lune", de:"Neumond",   he:"רֹאשׁ חֹדֶשׁ", ru:"Новолуние" },
  moonPhase:      { pt:"Fase Lunar", en:"Moon Phase", es:"Fase Lunar",   fr:"Phase Lunaire", de:"Mondphase", he:"שְׁלַב הַיָּרֵחַ", ru:"Фаза луны" },
  // ── Versículo ──────────────────────────────────────
  dailyVerse:     { pt:"Versículo Diário", en:"Daily Verse", es:"Versículo Diario", fr:"Verset Quotidien", de:"Tagesvers", he:"פָּסוּק יוֹמִי", ru:"Стих дня" },
  share:          { pt:"Compartilhar", en:"Share", es:"Compartir", fr:"Partager", de:"Teilen", he:"שִׁתּוּף", ru:"Поделиться" },
  copy:           { pt:"Copiar",  en:"Copy",   es:"Copiar",  fr:"Copier", de:"Kopieren", he:"הַעְתֵּק", ru:"Копировать" },
  copied:         { pt:"Copiado!", en:"Copied!", es:"¡Copiado!", fr:"Copié!", de:"Kopiert!", he:"הועתק!", ru:"Скопировано!" },
  // ── Configurações ──────────────────────────────────
  appearance:     { pt:"Aparência",     en:"Appearance",   es:"Apariencia",   fr:"Apparence",   de:"Aussehen",     he:"מַרְאֶה",     ru:"Внешний вид" },
  darkTheme:      { pt:"Escuro",        en:"Dark",         es:"Oscuro",       fr:"Sombre",      de:"Dunkel",       he:"כֵּהֶה",       ru:"Тёмная" },
  lightTheme:     { pt:"Claro",         en:"Light",        es:"Claro",        fr:"Clair",       de:"Hell",         he:"בָּהִיר",      ru:"Светлая" },
  notifications:  { pt:"Notificações",  en:"Notifications",es:"Notificaciones",fr:"Notifications",de:"Benachrichtigungen",he:"הוֹדָעוֹת",ru:"Уведомления" },
  language:       { pt:"Idioma",        en:"Language",     es:"Idioma",       fr:"Langue",      de:"Sprache",      he:"שָׂפָה",       ru:"Язык" },
  enableAll:      { pt:"Ativar todas",  en:"Enable all",   es:"Activar todas",fr:"Activer tout",de:"Alle aktivieren",he:"הפעל הכל",  ru:"Включить все" },
  disableAll:     { pt:"Desativar todas",en:"Disable all", es:"Desactivar todas",fr:"Désactiver tout",de:"Alle deaktivieren",he:"כבה הכל", ru:"Выключить все" },
  // ── Meses PT / EN / ES / FR / DE ───────────────────
  months_pt: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  months_en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  months_es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
  months_fr: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
  months_de: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"],
  months_he: ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"],
  months_ru: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
  // ── Dias da semana ─────────────────────────────────
  weekdays_pt: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"],
  weekdays_en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  weekdays_es: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
  weekdays_fr: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],
  weekdays_de: ["So","Mo","Di","Mi","Do","Fr","Sa"],
  weekdays_he: ["ראש","שני","שלי","רבי","חמי","שישי","שבת"],
  weekdays_ru: ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],

  // ── Calendário (Home) ─────────────────────────────────────────────
  todayLabel:        { pt:"הַיּוֹם — HOJE", en:"הַיּוֹם — TODAY", es:"הַיּוֹם — HOY", fr:"הַיּוֹם — AUJOURD'HUI", de:"הַיּוֹם — HEUTE", he:"הַיּוֹם", ru:"הַיּוֹם — СЕГОДНЯ" },
  parashatOfDay:     { pt:"Parashat do Dia", en:"Parashah of the Day", es:"Parashat del Día", fr:"Parashat du Jour", de:"Parashat des Tages", he:"פָּרָשַׁת הַיּוֹם", ru:"Параша дня" },
  aliyahOf:          { pt:"{n}ª Aliá", en:"{n} Aliyah", es:"{n}ª Aliá", fr:"{n}e Aliya", de:"{n}. Alija", he:"עֲלִיָּה {n}", ru:"{n}-я алия" },
  fullWeekRef:       { pt:"Semana completa", en:"Full week", es:"Semana completa", fr:"Semaine complète", de:"Ganze Woche", he:"הַשָּׁבוּעַ כֻּלּוֹ", ru:"Вся неделя" },
  nextFeast:         { pt:"Próxima Festa", en:"Next Feast", es:"Próxima Fiesta", fr:"Prochaine Fête", de:"Nächstes Fest", he:"מוֹעֵד הַבָּא", ru:"Следующий праздник" },
  todayBang:         { pt:"Hoje!", en:"Today!", es:"¡Hoy!", fr:"Aujourd'hui!", de:"Heute!", he:"הַיּוֹם!", ru:"Сегодня!" },
  tomorrowBang:      { pt:"Amanhã!", en:"Tomorrow!", es:"¡Mañana!", fr:"Demain!", de:"Morgen!", he:"מָחָר!", ru:"Завтра!" },
  inDays:            { pt:"Em {n} dias", en:"In {n} days", es:"En {n} días", fr:"Dans {n} jours", de:"In {n} Tagen", he:"בְּעוֹד {n} יָמִים", ru:"Через {n} дней" },
  newHebrewDay:      { pt:"Novo dia hebraico iniciado", en:"New Hebrew day begun", es:"Nuevo día hebreo iniciado", fr:"Nouveau jour hébraïque commencé", de:"Neuer hebräischer Tag begonnen", he:"יוֹם עִבְרִי חָדָשׁ הֵחֵל", ru:"Начался новый еврейский день" },
  newHebrewDayDesc:  { pt:"Após as 18h o calendário hebraico já avançou para o próximo dia. O dia gregoriano muda à meia-noite.", en:"After 6pm the Hebrew calendar has already moved to the next day. The Gregorian day changes at midnight.", es:"Después de las 18h el calendario hebreo ya avanzó al día siguiente. El día gregoriano cambia a medianoche.", fr:"Après 18h, le calendrier hébraïque est déjà passé au jour suivant. Le jour grégorien change à minuit.", de:"Nach 18 Uhr ist der hebräische Kalender bereits zum nächsten Tag übergegangen. Der gregorianische Tag wechselt um Mitternacht.", he:"אַחֲרֵי 18:00 הַלּוּחַ הָעִבְרִי כְּבָר עָבַר לַיּוֹם הַבָּא.", ru:"После 18:00 еврейский календарь уже перешёл на следующий день. Григорианский день меняется в полночь." },
  hebrewDayAdvanced: { pt:"Dia hebraico avançou após 18h", en:"Hebrew day advanced after 6pm", es:"Día hebreo avanzó después de las 18h", fr:"Jour hébraïque avancé après 18h", de:"Hebräischer Tag nach 18 Uhr fortgeschritten", he:"הַיּוֹם הָעִבְרִי הִתְקַדֵּם אַחֲרֵי 18:00", ru:"Еврейский день продвинулся после 18:00" },
  civilTime:         { pt:"hora civil", en:"civil time", es:"hora civil", fr:"heure civile", de:"Zivilzeit", he:"שָׁעָה אֶזְרָחִית", ru:"гражданское время" },
  legendToday:       { pt:"Hoje (Heb)", en:"Today (Heb)", es:"Hoy (Heb)", fr:"Aujourd'hui (Héb)", de:"Heute (Hebr)", he:"הַיּוֹם (עב')", ru:"Сегодня (евр.)" },
  legendFeast:       { pt:"Festa Bíblica", en:"Biblical Feast", es:"Fiesta Bíblica", fr:"Fête Biblique", de:"Biblisches Fest", he:"מוֹעֵד מִקְרָאִי", ru:"Библейский праздник" },
  legendShabat:      { pt:"Shabat", en:"Shabbat", es:"Shabat", fr:"Chabbat", de:"Schabbat", he:"שַׁבָּת", ru:"Шаббат" },
  legendErev:        { pt:"🌙 Erev (véspera)", en:"🌙 Erev (eve)", es:"🌙 Erev (víspera)", fr:"🌙 Erev (veille)", de:"🌙 Erev (Vorabend)", he:"🌙 עֶרֶב", ru:"🌙 Эрев (канун)" },

  // ── Conversor ──────────────────────────────────────────────────────
  converterTitle:    { pt:"Conversor de Datas", en:"Date Converter", es:"Conversor de Fechas", fr:"Convertisseur de Dates", de:"Datumskonverter", he:"מַמִּיר תַּאֲרִיכִים", ru:"Конвертер дат" },
  converterSub:      { pt:"Descubra sua data no calendário bíblico e sua tribo de Israel", en:"Discover your date in the biblical calendar and your tribe of Israel", es:"Descubre tu fecha en el calendario bíblico y tu tribu de Israel", fr:"Découvrez votre date dans le calendrier biblique et votre tribu d'Israël", de:"Entdecke dein Datum im biblischen Kalender und deinen Stamm Israels", he:"גַּלֵּה אֶת תַּאֲרִיכְךָ בַּלּוּחַ הַמִּקְרָאִי וְאֶת שִׁבְטְךָ", ru:"Узнайте свою дату по библейскому календарю и своё колено Израиля" },
  tabBirthday:       { pt:"🎂 Meu Aniversário Hebraico", en:"🎂 My Hebrew Birthday", es:"🎂 Mi Cumpleaños Hebreo", fr:"🎂 Mon Anniversaire Hébraïque", de:"🎂 Mein Hebräischer Geburtstag", he:"🎂 יוֹם הֻלֶּדֶת עִבְרִי", ru:"🎂 Мой еврейский день рождения" },
  tabConvertAny:     { pt:"📅 Converter Qualquer Data", en:"📅 Convert Any Date", es:"📅 Convertir Cualquier Fecha", fr:"📅 Convertir N'importe Quelle Date", de:"📅 Beliebiges Datum Umrechnen", he:"📅 הָמֵר כָּל תַּאֲרִיךְ", ru:"📅 Конвертировать любую дату" },
  enterBirthDate:    { pt:"🎂 Digite sua data de nascimento", en:"🎂 Enter your birth date", es:"🎂 Ingresa tu fecha de nacimiento", fr:"🎂 Entrez votre date de naissance", de:"🎂 Gib dein Geburtsdatum ein", he:"🎂 הַזֵּן אֶת תַּאֲרִיךְ לֵדָתְךָ", ru:"🎂 Введите вашу дату рождения" },
  discover:          { pt:"Descobrir ✡", en:"Discover ✡", es:"Descubrir ✡", fr:"Découvrir ✡", de:"Entdecken ✡", he:"גַּלֵּה ✡", ru:"Узнать ✡" },
  yourBirthHebrew:   { pt:"Seu nascimento no calendário hebraico", en:"Your birth in the Hebrew calendar", es:"Tu nacimiento en el calendario hebreo", fr:"Votre naissance dans le calendrier hébraïque", de:"Deine Geburt im hebräischen Kalender", he:"לֵדָתְךָ בַּלּוּחַ הָעִבְרִי", ru:"Ваше рождение по еврейскому календарю" },
  bornOnA:           { pt:"Nasceu numa {day}", en:"Born on a {day}", es:"Nació un {day}", fr:"Né un {day}", de:"Geboren an einem {day}", he:"נוֹלַד בְּיוֹם {day}", ru:"Родился в {day}" },
  biblicalSummary:   { pt:"RESUMO BÍBLICO", en:"BIBLICAL SUMMARY", es:"RESUMEN BÍBLICO", fr:"RÉSUMÉ BIBLIQUE", de:"BIBLISCHE ZUSAMMENFASSUNG", he:"תַּקְצִיר מִקְרָאִי", ru:"Библейская сводка" },
  hebrewMonthLabel:  { pt:"Mês Hebraico", en:"Hebrew Month", es:"Mes Hebreo", fr:"Mois Hébraïque", de:"Hebräischer Monat", he:"חֹדֶשׁ עִבְרִי", ru:"Еврейский месяц" },
  hebrewDayLabel:    { pt:"Dia Hebraico", en:"Hebrew Day", es:"Día Hebreo", fr:"Jour Hébraïque", de:"Hebräischer Tag", he:"יוֹם עִבְרִי", ru:"Еврейский день" },
  hebrewYearLabel:   { pt:"Ano Hebraico", en:"Hebrew Year", es:"Año Hebreo", fr:"Année Hébraïque", de:"Hebräisches Jahr", he:"שָׁנָה עִבְרִית", ru:"Еврейский год" },
  tribeLabel:        { pt:"Tribo", en:"Tribe", es:"Tribu", fr:"Tribu", de:"Stamm", he:"שֵׁבֶט", ru:"Колено" },
  mazalLabel:        { pt:"Mazal", en:"Mazal", es:"Mazal", fr:"Mazal", de:"Mazal", he:"מַזָּל", ru:"Мазаль" },
  stoneLabel:        { pt:"Pedra", en:"Stone", es:"Piedra", fr:"Pierre", de:"Stein", he:"אֶבֶן", ru:"Камень" },
  parashatLabel:     { pt:"Parashat", en:"Parashah", es:"Parashat", fr:"Parashat", de:"Parashat", he:"פָּרָשָׁה", ru:"Параша" },
  bornDuringFeast:   { pt:"Nasceu durante {feast}!", en:"Born during {feast}!", es:"¡Nació durante {feast}!", fr:"Né pendant {feast}!", de:"Geboren während {feast}!", he:"נוֹלַד בִּתְקוּפַת {feast}!", ru:"Родился во время {feast}!" },
  yourTribeTitle:    { pt:"✡ Sua Tribo de Israel", en:"✡ Your Tribe of Israel", es:"✡ Tu Tribu de Israel", fr:"✡ Votre Tribu d'Israël", de:"✡ Dein Stamm Israels", he:"✡ הַשֵּׁבֶט שֶׁלְּךָ", ru:"✡ Ваше колено Израиля" },
  tribeBasedOn:      { pt:"Baseado no mês hebraico do seu nascimento — tradição do Sefer Yetzirah", en:"Based on the Hebrew month of your birth — Sefer Yetzirah tradition", es:"Basado en el mes hebreo de tu nacimiento — tradición del Sefer Yetzirah", fr:"Basé sur le mois hébraïque de votre naissance — tradition du Sefer Yetzirah", de:"Basierend auf dem hebräischen Monat deiner Geburt — Sefer-Yetzirah-Tradition", he:"מְבֻסָּס עַל הַחֹדֶשׁ הָעִבְרִי שֶׁל לֵדָתְךָ", ru:"На основе еврейского месяца вашего рождения — традиция Сефер Йецира" },
  yourBirthParasha:  { pt:"📖 Sua Parashat de Nascimento", en:"📖 Your Birth Parashah", es:"📖 Tu Parashat de Nacimiento", fr:"📖 Votre Parashat de Naissance", de:"📖 Deine Geburts-Parascha", he:"📖 הַפָּרָשָׁה שֶׁל לֵדָתְךָ", ru:"📖 Ваша параша рождения" },
  birthParashaDesc:  { pt:"A porção da Torá lida na semana correspondente ao seu nascimento", en:"The Torah portion read the week corresponding to your birth", es:"La porción de la Torá leída en la semana correspondiente a tu nacimiento", fr:"La portion de la Torah lue la semaine correspondant à votre naissance", de:"Der Toraabschnitt, der in der Woche deiner Geburt gelesen wurde", he:"קֶטַע הַתּוֹרָה שֶׁנִּקְרָא בַּשָּׁבוּעַ שֶׁל לֵדָתְךָ", ru:"Отрывок Торы, читаемый в неделю вашего рождения" },
  gregorianDate:     { pt:"Data Gregoriana", en:"Gregorian Date", es:"Fecha Gregoriana", fr:"Date Grégorienne", de:"Gregorianisches Datum", he:"תַּאֲרִיךְ גְּרֵגוֹרְיָאנִי", ru:"Григорианская дата" },
  convertBtn:        { pt:"Converter ✡", en:"Convert ✡", es:"Convertir ✡", fr:"Convertir ✡", de:"Umrechnen ✡", he:"הָמֵר ✡", ru:"Конвертировать ✡" },
  hebrewDateResult:  { pt:"Data no Calendário Hebraico", en:"Date in the Hebrew Calendar", es:"Fecha en el Calendario Hebreo", fr:"Date dans le Calendrier Hébraïque", de:"Datum im Hebräischen Kalender", he:"תַּאֲרִיךְ בַּלּוּחַ הָעִבְרִי", ru:"Дата по еврейскому календарю" },
  equivalence:       { pt:"EQUIVALÊNCIA", en:"EQUIVALENCE", es:"EQUIVALENCIA", fr:"ÉQUIVALENCE", de:"ÄQUIVALENZ", he:"מַקְבִּילָה", ru:"Эквивалент" },
  gregorianLabel:    { pt:"GREGORIANO", en:"GREGORIAN", es:"GREGORIANO", fr:"GRÉGORIEN", de:"GREGORIANISCH", he:"גְּרֵגוֹרְיָאנִי", ru:"ГРИГОРИАНСКИЙ" },
  hebrewLabel:       { pt:"HEBRAICO", en:"HEBREW", es:"HEBREO", fr:"HÉBREU", de:"HEBRÄISCH", he:"עִבְרִי", ru:"ЕВРЕЙСКИЙ" },
  annoMundi:         { pt:"Anno Mundi", en:"Anno Mundi", es:"Anno Mundi", fr:"Anno Mundi", de:"Anno Mundi", he:"לִבְּרִיאַת הָעוֹלָם", ru:"Anno Mundi" },
  weekdayHebrewLabel:{ pt:"DIA DA SEMANA HEBRAICO", en:"HEBREW WEEKDAY", es:"DÍA DE LA SEMANA HEBREO", fr:"JOUR DE LA SEMAINE HÉBREU", de:"HEBRÄISCHER WOCHENTAG", he:"יוֹם בַּשָּׁבוּעַ הָעִבְרִי", ru:"Еврейский день недели" },
  itsShabat:         { pt:"🕯️ Shabat!", en:"🕯️ Shabbat!", es:"🕯️ ¡Shabat!", fr:"🕯️ Chabbat!", de:"🕯️ Schabbat!", he:"🕯️ שַׁבָּת!", ru:"🕯️ Шаббат!" },
  dateIsFeast:       { pt:"Esta data é {feast}!", en:"This date is {feast}!", es:"¡Esta fecha es {feast}!", fr:"Cette date est {feast}!", de:"Dieses Datum ist {feast}!", he:"תַּאֲרִיךְ זֶה הוּא {feast}!", ru:"Эта дата — {feast}!" },
  monthTribeTitle:   { pt:"✡ Tribo do Mês de {month}", en:"✡ Tribe of the Month of {month}", es:"✡ Tribu del Mes de {month}", fr:"✡ Tribu du Mois de {month}", de:"✡ Stamm des Monats {month}", he:"✡ שֵׁבֶט הַחֹדֶשׁ {month}", ru:"✡ Колено месяца {month}" },
  allTribesTitle:    { pt:"As 12 Tribos de Israel e os Meses Hebraicos", en:"The 12 Tribes of Israel and the Hebrew Months", es:"Las 12 Tribus de Israel y los Meses Hebreos", fr:"Les 12 Tribus d'Israël et les Mois Hébraïques", de:"Die 12 Stämme Israels und die hebräischen Monate", he:"12 שִׁבְטֵי יִשְׂרָאֵל וְהַחֳדָשִׁים הָעִבְרִיִּים", ru:"12 колен Израиля и еврейские месяцы" },
  allTribesSub:      { pt:"Baseado no Sefer Yetzirah, Arizal e tradição judaica", en:"Based on Sefer Yetzirah, Arizal and Jewish tradition", es:"Basado en el Sefer Yetzirah, Arizal y la tradición judía", fr:"Basé sur le Sefer Yetzirah, l'Arizal et la tradition juive", de:"Basierend auf Sefer Yetzirah, Arizal und jüdischer Tradition", he:"מְבֻסָּס עַל סֵפֶר יְצִירָה, הָאֲרִ״י וְהַמָּסֹרֶת הַיְּהוּדִית", ru:"На основе Сефер Йецира, Аризаля и еврейской традиции" },
  giftsLabel:        { pt:"✨ DONS", en:"✨ GIFTS", es:"✨ DONES", fr:"✨ DONS", de:"✨ GABEN", he:"✨ מַתָּנוֹת", ru:"✨ Дары" },
  challengeLabel:    { pt:"⚔️ DESAFIO", en:"⚔️ CHALLENGE", es:"⚔️ DESAFÍO", fr:"⚔️ DÉFI", de:"⚔️ HERAUSFORDERUNG", he:"⚔️ אֶתְגָּר", ru:"⚔️ Вызов" },
  hoshenStone:       { pt:"PEDRA DO HOSHEN (PEITORAL DO SUMO SACERDOTE)", en:"HOSHEN STONE (HIGH PRIEST'S BREASTPLATE)", es:"PIEDRA DEL HOSHEN (PECTORAL DEL SUMO SACERDOTE)", fr:"PIERRE DU HOSHEN (PECTORAL DU GRAND PRÊTRE)", de:"HOSHEN-STEIN (BRUSTSCHILD DES HOHENPRIESTERS)", he:"אֶבֶן הַחֹשֶׁן", ru:"Камень хошена (нагрудник первосвященника)" },
  jacobsBlessing:    { pt:"📜 BÊNÇÃO DE YAAKOV", en:"📜 JACOB'S BLESSING", es:"📜 BENDICIÓN DE YAAKOV", fr:"📜 BÉNÉDICTION DE YAAKOV", de:"📜 JAAKOBS SEGEN", he:"📜 בִּרְכַּת יַעֲקֹב", ru:"📜 Благословение Иакова" },
  monthOf:           { pt:"Mês de {month}", en:"Month of {month}", es:"Mes de {month}", fr:"Mois de {month}", de:"Monat {month}", he:"חֹדֶשׁ {month}", ru:"Месяц {month}" },

  // ── Parashah page ──────────────────────────────────────────────────
  parashaHeaderSub:  { pt:"Leitura semanal da Torá — Ano 5786 (2025-2026)", en:"Weekly Torah reading — Year 5786 (2025-2026)", es:"Lectura semanal de la Torá — Año 5786 (2025-2026)", fr:"Lecture hebdomadaire de la Torah — Année 5786 (2025-2026)", de:"Wöchentliche Tora-Lesung — Jahr 5786 (2025-2026)", he:"קְרִיאַת הַתּוֹרָה הַשְּׁבוּעִית — שְׁנַת תשפ״ו", ru:"Еженедельное чтение Торы — год 5786 (2025-2026)" },
  thisWeekBadge:     { pt:"📖 ESTA SEMANA", en:"📖 THIS WEEK", es:"📖 ESTA SEMANA", fr:"📖 CETTE SEMAINE", de:"📖 DIESE WOCHE", he:"📖 הַשָּׁבוּעַ", ru:"📖 На этой неделе" },
  doublePortionBadge:{ pt:"⚡ Porção Dupla", en:"⚡ Double Portion", es:"⚡ Porción Doble", fr:"⚡ Double Portion", de:"⚡ Doppelabschnitt", he:"⚡ פָּרָשָׁה כְּפוּלָה", ru:"⚡ Двойная часть" },
  torahLabelIcon:    { pt:"📚 Torá:", en:"📚 Torah:", es:"📚 Torá:", fr:"📚 Torah:", de:"📚 Tora:", he:"📚 תּוֹרָה:", ru:"📚 Тора:" },
  haftaraLabelIcon:  { pt:"🎵 Haftará:", en:"🎵 Haftarah:", es:"🎵 Haftará:", fr:"🎵 Haftara:", de:"🎵 Haftara:", he:"🎵 הַפְטָרָה:", ru:"🎵 Гафтара:" },
  britLabelIcon:     { pt:"✡ B'rit Chadashá:", en:"✡ B'rit Chadashah:", es:"✡ B'rit Chadashá:", fr:"✡ B'rit Chadasha:", de:"✡ B'rit Chadascha:", he:"✡ הַבְּרִית הַחֲדָשָׁה:", ru:"✡ Брит Хадаша:" },
  shabatLabelIcon:   { pt:"📅 Shabat:", en:"📅 Shabbat:", es:"📅 Shabat:", fr:"📅 Chabbat:", de:"📅 Schabbat:", he:"📅 שַׁבָּת:", ru:"📅 Шаббат:" },
  israelDiasporaDiff:{ pt:"🌍 DIFERENÇA ISRAEL × DIÁSPORA", en:"🌍 ISRAEL × DIASPORA DIFFERENCE", es:"🌍 DIFERENCIA ISRAEL × DIÁSPORA", fr:"🌍 DIFFÉRENCE ISRAËL × DIASPORA", de:"🌍 UNTERSCHIED ISRAEL × DIASPORA", he:"🌍 הֶבְדֵּל יִשְׂרָאֵל וְתְפוּצוֹת", ru:"🌍 Разница Израиль × Диаспора" },
  israelBadge:       { pt:"🇮🇱 ISRAEL", en:"🇮🇱 ISRAEL", es:"🇮🇱 ISRAEL", fr:"🇮🇱 ISRAËL", de:"🇮🇱 ISRAEL", he:"🇮🇱 יִשְׂרָאֵל", ru:"🇮🇱 Израиль" },
  diasporaBadge:     { pt:"🌎 DIÁSPORA", en:"🌎 DIASPORA", es:"🌎 DIÁSPORA", fr:"🌎 DIASPORA", de:"🌎 DIASPORA", he:"🌎 תְּפוּצוֹת", ru:"🌎 Диаспора" },
  nextShabatCountdown:{ pt:"Próximo Shabat:", en:"Next Shabbat:", es:"Próximo Shabat:", fr:"Prochain Chabbat:", de:"Nächster Schabbat:", he:"שַׁבָּת הַבָּא:", ru:"Следующий Шаббат:" },
  nextReading:       { pt:"Próxima leitura:", en:"Next reading:", es:"Próxima lectura:", fr:"Prochaine lecture:", de:"Nächste Lesung:", he:"קְרִיאָה הַבָּאָה:", ru:"Следующее чтение:" },
  nextWeekBadge:     { pt:"PRÓXIMA SEMANA —", en:"NEXT WEEK —", es:"PRÓXIMA SEMANA —", fr:"SEMAINE PROCHAINE —", de:"NÄCHSTE WOCHE —", he:"שָׁבוּעַ הַבָּא —", ru:"Следующая неделя —" },
  modeDiaspora:      { pt:"🌎 Diáspora", en:"🌎 Diaspora", es:"🌎 Diáspora", fr:"🌎 Diaspora", de:"🌎 Diaspora", he:"🌎 תְּפוּצוֹת", ru:"🌎 Диаспора" },
  modeIsrael:        { pt:"🇮🇱 Israel", en:"🇮🇱 Israel", es:"🇮🇱 Israel", fr:"🇮🇱 Israël", de:"🇮🇱 Israel", he:"🇮🇱 יִשְׂרָאֵל", ru:"🇮🇱 Израиль" },
  filterAll:         { pt:"Todos", en:"All", es:"Todos", fr:"Tous", de:"Alle", he:"הַכֹּל", ru:"Все" },
  searchParasha:     { pt:"🔍 Buscar por nome, referência, tema ou Haftará…", en:"🔍 Search by name, reference, theme or Haftarah…", es:"🔍 Buscar por nombre, referencia, tema o Haftará…", fr:"🔍 Rechercher par nom, référence, thème ou Haftara…", de:"🔍 Suche nach Name, Referenz, Thema oder Haftara…", he:"🔍 חַפֵּשׂ לְפִי שֵׁם, מַרְאֶה מָקוֹם אוֹ הַפְטָרָה…", ru:"🔍 Поиск по имени, ссылке, теме или гафтаре…" },
  currentBadge:      { pt:"● Atual", en:"● Current", es:"● Actual", fr:"● Actuel", de:"● Aktuell", he:"● נוֹכְחִי", ru:"● Текущая" },
  noParashaFound:    { pt:"Nenhuma porção encontrada para", en:"No portion found for", es:"No se encontró ninguna porción para", fr:"Aucune portion trouvée pour", de:"Kein Abschnitt gefunden für", he:"לֹא נִמְצָא קֶטַע עֲבוּר", ru:"Не найдено ни одной части для" },

  // ── Festas page ─────────────────────────────────────────────────────
  feastsHeaderSub:   { pt:"Os Moadim — Encontros Marcados pelo Eterno", en:"The Moadim — Appointed Times of the Eternal", es:"Los Moadim — Citas Señaladas del Eterno", fr:"Les Moadim — Rendez-vous Fixés par l'Éternel", de:"Die Moadim — Festgesetzte Zeiten des Ewigen", he:"הַמּוֹעֲדִים — זְמַנֵּי ה' הַקְּבוּעִים", ru:"Моадим — назначенные времена Вечного" },
  upcomingFeastsBox: { pt:"⭐ Festas Próximas (próximos 365 dias)", en:"⭐ Upcoming Feasts (next 365 days)", es:"⭐ Próximas Fiestas (próximos 365 días)", fr:"⭐ Prochaines Fêtes (365 prochains jours)", de:"⭐ Bevorstehende Feste (nächste 365 Tage)", he:"⭐ מוֹעֲדִים360 קְרוֹבִים (365 יָמִים הַבָּאִים)", ru:"⭐ Предстоящие праздники (следующие 365 дней)" },
  tabSpring:         { pt:"🌸 Primavera", en:"🌸 Spring", es:"🌸 Primavera", fr:"🌸 Printemps", de:"🌸 Frühling", he:"🌸 אָבִיב", ru:"🌸 Весна" },
  tabFall:           { pt:"🍂 Outono", en:"🍂 Fall", es:"🍂 Otoño", fr:"🍂 Automne", de:"🍂 Herbst", he:"🍂 סְתָיו", ru:"🍂 Осень" },
  tabOther:          { pt:"✨ Outras", en:"✨ Other", es:"✨ Otras", fr:"✨ Autres", de:"✨ Andere", he:"✨ אֲחֵרוֹת", ru:"✨ Другие" },
  messianicMeaning:  { pt:"✡ SIGNIFICADO MESSIÂNICO", en:"✡ MESSIANIC MEANING", es:"✡ SIGNIFICADO MESIÁNICO", fr:"✡ SIGNIFICATION MESSIANIQUE", de:"✡ MESSIANISCHE BEDEUTUNG", he:"✡ מַשְׁמָעוּת מָשִׁיחִית", ru:"✡ Мессианское значение" },
  daysLabel:         { pt:"dias", en:"days", es:"días", fr:"jours", de:"Tage", he:"יָמִים", ru:"дней" },
  categorySpring:    { pt:"Primavera", en:"Spring", es:"Primavera", fr:"Printemps", de:"Frühling", he:"אָבִיב", ru:"Весна" },
  categoryFall:      { pt:"Outono", en:"Fall", es:"Otoño", fr:"Automne", de:"Herbst", he:"סְתָיו", ru:"Осень" },
  categoryOther:     { pt:"Outras", en:"Other", es:"Otras", fr:"Autres", de:"Andere", he:"אֲחֵרוֹת", ru:"Другие" },

  // ── Rosh Chodesh page ──────────────────────────────────────────────
  roshChodeshTitle:  { pt:"🌙 Lua Nova", en:"🌙 New Moon", es:"🌙 Luna Nueva", fr:"🌙 Nouvelle Lune", de:"🌙 Neumond", he:"🌙 רֹאשׁ חֹדֶשׁ", ru:"🌙 Новолуние" },
  roshChodeshSub:    { pt:"Rosh Chodesh — O Início de Cada Mês Hebraico", en:"Rosh Chodesh — The Start of Each Hebrew Month", es:"Rosh Chodesh — El Inicio de Cada Mes Hebreo", fr:"Rosh Chodesh — Le Début de Chaque Mois Hébraïque", de:"Rosch Chodesch — Der Beginn jedes hebräischen Monats", he:"רֹאשׁ חֹדֶשׁ — תְּחִלַּת כָּל חֹדֶשׁ עִבְרִי", ru:"Рош Ходеш — начало каждого еврейского месяца" },
  cycleDay:          { pt:"Dia {n} do ciclo lunar", en:"Day {n} of the lunar cycle", es:"Día {n} del ciclo lunar", fr:"Jour {n} du cycle lunaire", de:"Tag {n} des Mondzyklus", he:"יוֹם {n} בַּמַּחֲזוֹר הַיָּרֵחִי", ru:"День {n} лунного цикла" },
  daysSinceNewMoon:  { pt:"dias desde a Lua Nova", en:"days since New Moon", es:"días desde la Luna Nueva", fr:"jours depuis la Nouvelle Lune", de:"Tage seit Neumond", he:"יָמִים מֵראשׁ חֹדֶשׁ", ru:"дней с новолуния" },
  todayLabel2:       { pt:"Hoje:", en:"Today:", es:"Hoy:", fr:"Aujourd'hui:", de:"Heute:", he:"הַיּוֹם:", ru:"Сегодня:" },
  nextRoshChodesh:   { pt:"PRÓXIMO ROSH CHODESH", en:"NEXT ROSH CHODESH", es:"PRÓXIMO ROSH CHODESH", fr:"PROCHAIN ROSH CHODESH", de:"NÄCHSTER ROSCH CHODESCH", he:"רֹאשׁ חֹדֶשׁ הַבָּא", ru:"Следующий Рош Ходеш" },
  daysWord:          { pt:"dias", en:"days", es:"días", fr:"jours", de:"Tage", he:"יָמִים", ru:"дней" },
  dayWord:           { pt:"dia", en:"day", es:"día", fr:"jour", de:"Tag", he:"יוֹם", ru:"день" },
  fullCalendarRC:    { pt:"Calendário de Rosh Chodesh 5786", en:"Rosh Chodesh Calendar 5786", es:"Calendario de Rosh Chodesh 5786", fr:"Calendrier de Rosh Chodesh 5786", de:"Rosch-Chodesch-Kalender 5786", he:"לוּחַ רָאשֵׁי חֳדָשִׁים תשפ״ו", ru:"Календарь Рош Ходеш 5786" },
  past:              { pt:"Passado", en:"Past", es:"Pasado", fr:"Passé", de:"Vergangen", he:"עָבַר", ru:"Прошло" },
  roshChodeshMeaning:{ pt:"🌙 O Significado de Rosh Chodesh", en:"🌙 The Meaning of Rosh Chodesh", es:"🌙 El Significado de Rosh Chodesh", fr:"🌙 La Signification de Rosh Chodesh", de:"🌙 Die Bedeutung von Rosch Chodesch", he:"🌙 מַשְׁמָעוּת רֹאשׁ חֹדֶשׁ", ru:"🌙 Значение Рош Ходеша" },
  roshChodeshText1: {
    pt:'Rosh Chodesh (ראש חודש) significa "cabeça do mês" — o dia da Lua Nova. No calendário hebraico, cada novo mês começa com a renovação da lua, símbolo de renovação espiritual para Israel. As mulheres têm uma conexão especial com Rosh Chodesh, pois se recusaram a dar seus ornamentos para o bezerro de ouro (Êxodo 32), sendo recompensadas com este dia sagrado.',
    en:'Rosh Chodesh (ראש חודש) means "head of the month" — the day of the New Moon. In the Hebrew calendar, each new month begins with the moon\'s renewal, a symbol of spiritual renewal for Israel. Women have a special connection to Rosh Chodesh, as they refused to give their ornaments for the golden calf (Exodus 32), being rewarded with this sacred day.',
    es:'Rosh Chodesh (ראש חודש) significa "cabeza del mes" — el día de la Luna Nueva. En el calendario hebreo, cada mes nuevo comienza con la renovación de la luna, símbolo de renovación espiritual para Israel. Las mujeres tienen una conexión especial con Rosh Chodesh, pues se negaron a dar sus adornos para el becerro de oro (Éxodo 32), siendo recompensadas con este día sagrado.',
    fr:'Rosh Chodesh (ראש חודש) signifie "tête du mois" — le jour de la Nouvelle Lune. Dans le calendrier hébraïque, chaque nouveau mois commence par le renouvellement de la lune, symbole de renouveau spirituel pour Israël. Les femmes ont un lien spécial avec Rosh Chodesh, car elles refusèrent de donner leurs bijoux pour le veau d\'or (Exode 32), étant récompensées par ce jour sacré.',
    de:'Rosch Chodesch (ראש חודש) bedeutet "Kopf des Monats" — der Tag des Neumonds. Im hebräischen Kalender beginnt jeder neue Monat mit der Erneuerung des Mondes, ein Symbol geistlicher Erneuerung für Israel. Frauen haben eine besondere Verbindung zu Rosch Chodesch, da sie sich weigerten, ihren Schmuck für das goldene Kalb herzugeben (2. Mose 32), und mit diesem heiligen Tag belohnt wurden.',
    he:'רֹאשׁ חֹדֶשׁ מְסַמֵּל אֶת יוֹם הַלְּבָנָה הַחֲדָשָׁה. בַּלּוּחַ הָעִבְרִי, כָּל חֹדֶשׁ חָדָשׁ מַתְחִיל בְּהִתְחַדְּשׁוּת הַיָּרֵחַ — סֵמֶל לְהִתְחַדְּשׁוּת רוּחָנִית לְיִשְׂרָאֵל.',
    ru:'Рош Ходеш (ראש חודש) означает «глава месяца» — день Новолуния. В еврейском календаре каждый новый месяц начинается с обновления луны, символа духовного обновления для Израиля. Женщины имеют особую связь с Рош Ходешем, так как отказались отдать свои украшения для золотого тельца (Исход 32), будучи вознаграждены этим святым днём.',
  },
  roshChodeshText2: {
    pt:'Nos tempos do Templo, Rosh Chodesh era declarado por testemunhas que avistavam a lua nova. Ofertas especiais eram trazidas (Números 28:11-15) e o shofar era tocado. Para os crentes messiânicos, aponta para a renovação em Yeshua — "a quem pertence a sombra, mas o corpo pertence ao Messias" (Colossenses 2:17).',
    en:'In Temple times, Rosh Chodesh was declared by witnesses who sighted the new moon. Special offerings were brought (Numbers 28:11-15) and the shofar was sounded. For Messianic believers, it points to renewal in Yeshua — "which are a shadow of things to come; but the substance is of Christ" (Colossians 2:17).',
    es:'En los tiempos del Templo, Rosh Chodesh era declarado por testigos que avistaban la luna nueva. Se traían ofrendas especiales (Números 28:11-15) y se tocaba el shofar. Para los creyentes mesiánicos, apunta a la renovación en Yeshua — "sombra de lo que ha de venir; pero el cuerpo es de Cristo" (Colosenses 2:17).',
    fr:'À l\'époque du Temple, Rosh Chodesh était déclaré par des témoins qui apercevaient la nouvelle lune. Des offrandes spéciales étaient apportées (Nombres 28:11-15) et le shofar était sonné. Pour les croyants messianiques, cela pointe vers le renouveau en Yeshua — "c\'est l\'ombre des choses à venir, mais le corps est en Christ" (Colossiens 2:17).',
    de:'In der Zeit des Tempels wurde Rosch Chodesch von Zeugen erklärt, die den Neumond sichteten. Besondere Opfer wurden gebracht (4. Mose 28:11-15) und der Schofar geblasen. Für messianische Gläubige weist es auf die Erneuerung in Jeschua hin — "die ein Schatten der zukünftigen Dinge sind; der Körper aber ist Christi" (Kolosser 2:17).',
    he:'בִּימֵי בֵּית הַמִּקְדָּשׁ, רֹאשׁ חֹדֶשׁ הֻכְרַז עַל יְדֵי עֵדִים שֶׁרָאוּ אֶת הַלְּבָנָה הַחֲדָשָׁה. קָרְבָּנוֹת מְיֻחָדִים הוּבְאוּ (בְּמִדְבַּר כח:יא-טו) וְהַשּׁוֹפָר נִתְקַע.',
    ru:'Во времена Храма Рош Ходеш объявлялся свидетелями, увидевшими новую луну. Приносились особые жертвы (Числа 28:11-15) и трубили в шофар. Для мессианских верующих это указывает на обновление в Йешуа.',
  },

  // ── Verse page ──────────────────────────────────────────────────────
  verseHebrew:       { pt:"Hebraico", en:"Hebrew", es:"Hebreo", fr:"Hébreu", de:"Hebräisch", he:"עִבְרִית", ru:"Иврит" },
  versePortuguese:   { pt:"Português", en:"Portuguese", es:"Portugués", fr:"Portugais", de:"Portugiesisch", he:"פּוֹרְטוּגֶזִית", ru:"Португальский" },
  copyBtn:           { pt:"📋 Copiar", en:"📋 Copy", es:"📋 Copiar", fr:"📋 Copier", de:"📋 Kopieren", he:"📋 הַעְתֵּק", ru:"📋 Копировать" },
  copiedBtn:         { pt:"✓ Copiado!", en:"✓ Copied!", es:"✓ ¡Copiado!", fr:"✓ Copié!", de:"✓ Kopiert!", he:"✓ הֻעְתַּק!", ru:"✓ Скопировано!" },
  whatsappBtn:       { pt:"📲 WhatsApp", en:"📲 WhatsApp", es:"📲 WhatsApp", fr:"📲 WhatsApp", de:"📲 WhatsApp", he:"📲 וַאטְסַאפּ", ru:"📲 WhatsApp" },
  shareBtn:          { pt:"🔗 Compartilhar", en:"🔗 Share", es:"🔗 Compartir", fr:"🔗 Partager", de:"🔗 Teilen", he:"🔗 שִׁתּוּף", ru:"🔗 Поделиться" },
  allVerses:         { pt:"Todos os Versículos", en:"All Verses", es:"Todos los Versículos", fr:"Tous les Versets", de:"Alle Verse", he:"כָּל הַפְּסוּקִים", ru:"Все стихи" },
  todayBadge:        { pt:"HOJE", en:"TODAY", es:"HOY", fr:"AUJOURD'HUI", de:"HEUTE", he:"הַיּוֹם", ru:"СЕГОДНЯ" },

  // ── Learn page ──────────────────────────────────────────────────────
  learnTitle:        { pt:"Os Meses Hebraicos", en:"The Hebrew Months", es:"Los Meses Hebreos", fr:"Les Mois Hébraïques", de:"Die Hebräischen Monate", he:"הַחֳדָשִׁים הָעִבְרִיִּים", ru:"Еврейские месяцы" },
  learnSub:          { pt:"Os 13 meses do calendário bíblico hebraico", en:"The 13 months of the Hebrew biblical calendar", es:"Los 13 meses del calendario bíblico hebreo", fr:"Les 13 mois du calendrier biblique hébraïque", de:"Die 13 Monate des hebräischen biblischen Kalenders", he:"13 הַחֳדָשִׁים שֶׁל הַלּוּחַ הַמִּקְרָאִי", ru:"13 месяцев еврейского библейского календаря" },
  lunisolarTitle:    { pt:"📖 O Calendário Lunissolar", en:"📖 The Lunisolar Calendar", es:"📖 El Calendario Lunisolar", fr:"📖 Le Calendrier Lunisolaire", de:"📖 Der Lunisolare Kalender", he:"📖 הַלּוּחַ הַשָּׁנִי-יָרֵחִי", ru:"📖 Лунно-солнечный календарь" },
  monthsOfYear:      { pt:"Os 13 Meses do Ano Hebraico", en:"The 13 Months of the Hebrew Year", es:"Los 13 Meses del Año Hebreo", fr:"Les 13 Mois de l'Année Hébraïque", de:"Die 13 Monate des Hebräischen Jahres", he:"13 חָדְשֵׁי הַשָּׁנָה הָעִבְרִית", ru:"13 месяцев еврейского года" },
  feastsThisMonth:   { pt:"Festas neste mês:", en:"Feasts this month:", es:"Fiestas este mes:", fr:"Fêtes ce mois-ci:", de:"Feste in diesem Monat:", he:"מוֹעֲדִים360 בְּחֹדֶשׁ זֶה:", ru:"Праздники в этом месяце:" },
  messianicConnTitle:{ pt:"✡ Conexão Messiânica", en:"✡ Messianic Connection", es:"✡ Conexión Mesiánica", fr:"✡ Connexion Messianique", de:"✡ Messianische Verbindung", he:"✡ הַקֶּשֶׁר הַמָּשִׁיחִי", ru:"✡ Мессианская связь" },
  lunisolarText: {
    pt:"O calendário hebraico é __lunissolar__ — baseado nos ciclos da lua e do sol. O primeiro mês bíblico é __Nissan__ (Êxodo 12:2), e o ano civil começa em __Tishrei__ (Rosh Hashaná). O ano hebraico conta desde a criação do mundo (Anno Mundi); adicione ~3760 ao ano gregoriano.",
    en:"The Hebrew calendar is __lunisolar__ — based on the cycles of the moon and the sun. The first biblical month is __Nissan__ (Exodus 12:2), and the civil year begins in __Tishrei__ (Rosh Hashanah). The Hebrew year counts from the creation of the world (Anno Mundi); add ~3760 to the Gregorian year.",
    es:"El calendario hebreo es __lunisolar__ — basado en los ciclos de la luna y el sol. El primer mes bíblico es __Nisán__ (Éxodo 12:2), y el año civil comienza en __Tishrei__ (Rosh Hashaná). El año hebreo cuenta desde la creación del mundo (Anno Mundi); agregue ~3760 al año gregoriano.",
    fr:"Le calendrier hébraïque est __lunisolaire__ — basé sur les cycles de la lune et du soleil. Le premier mois biblique est __Nissan__ (Exode 12:2), et l'année civile commence en __Tishrei__ (Roch Hachana). L'année hébraïque compte depuis la création du monde (Anno Mundi); ajoutez ~3760 à l'année grégorienne.",
    de:"Der hebräische Kalender ist __lunisolar__ — basierend auf den Zyklen von Mond und Sonne. Der erste biblische Monat ist __Nissan__ (2. Mose 12:2), und das bürgerliche Jahr beginnt im __Tischri__ (Rosch Haschana). Das hebräische Jahr zählt seit der Erschaffung der Welt (Anno Mundi); addiere ~3760 zum gregorianischen Jahr.",
    he:"הַלּוּחַ הָעִבְרִי הוּא __שָׁנִי-יָרֵחִי__ — מְבֻסָּס עַל מַחְזוֹרֵי הַיָּרֵחַ וְהַשֶּׁמֶשׁ. הַחֹדֶשׁ הַמִּקְרָאִי הָרִאשׁוֹן הוּא __נִיסָן__ (שְׁמוֹת יב:ב), וְהַשָּׁנָה הָאֶזְרָחִית מַתְחִילָה בְּ__תִּשְׁרֵי__ (רֹאשׁ הַשָּׁנָה).",
    ru:"Еврейский календарь __лунно-солнечный__ — основан на циклах луны и солнца. Первый библейский месяц — __Нисан__ (Исход 12:2), а гражданский год начинается в __Тишрей__ (Рош ха-Шана). Еврейский год отсчитывается от сотворения мира (Anno Mundi); добавьте ~3760 к григорианскому году.",
  },
  messianicConnText: {
    pt:"Para os crentes messiânicos, o calendário bíblico revela o plano redentor de Deus através de Yeshua. As festas da __primavera__ foram cumpridas em Sua primeira vinda, enquanto as festas do __outono__ apontam para Sua segunda vinda e o reinado eterno.",
    en:"For Messianic believers, the biblical calendar reveals God's redemptive plan through Yeshua. The __spring__ feasts were fulfilled at His first coming, while the __fall__ feasts point to His second coming and eternal reign.",
    es:"Para los creyentes mesiánicos, el calendario bíblico revela el plan redentor de Dios a través de Yeshua. Las fiestas de __primavera__ se cumplieron en Su primera venida, mientras que las fiestas de __otoño__ apuntan a Su segunda venida y reinado eterno.",
    fr:"Pour les croyants messianiques, le calendrier biblique révèle le plan rédempteur de Dieu à travers Yeshua. Les fêtes de __printemps__ ont été accomplies lors de Sa première venue, tandis que les fêtes d'__automne__ pointent vers Son second avènement et son règne éternel.",
    de:"Für messianische Gläubige offenbart der biblische Kalender Gottes Erlösungsplan durch Jeschua. Die __Frühlings__feste wurden bei Seinem ersten Kommen erfüllt, während die __Herbst__feste auf Sein zweites Kommen und ewiges Reich hinweisen.",
    he:"עֲבוּר מַאֲמִינִים מְשִׁיחִיִּים, הַלּוּחַ הַמִּקְרָאִי חוֹשֵׂף אֶת תָּכְנִית הַגְּאֻלָּה שֶׁל אֱלֹהִים דֶּרֶךְ יֵשׁוּעַ.",
    ru:"Для мессианских верующих библейский календарь открывает искупительный план Бога через Йешуа. Праздники __весны__ исполнились при Его первом пришествии, а праздники __осени__ указывают на Его второе пришествие и вечное царство.",
  },

  // ── Settings page ───────────────────────────────────────────────────
  settingsTitle:     { pt:"⚙️ Configurações", en:"⚙️ Settings", es:"⚙️ Configuración", fr:"⚙️ Paramètres", de:"⚙️ Einstellungen", he:"⚙️ הַגְדָּרוֹת", ru:"⚙️ Настройки" },
  settingsSub:       { pt:"Personalize sua experiência", en:"Customize your experience", es:"Personaliza tu experiencia", fr:"Personnalisez votre expérience", de:"Passe deine Erfahrung an", he:"הַתְאֵם אֶת הַחֲוָיָה שֶׁלְּךָ", ru:"Настройте свой опыт" },
  themeDark:         { pt:"Escuro", en:"Dark", es:"Oscuro", fr:"Sombre", de:"Dunkel", he:"כֵּהֶה", ru:"Тёмная" },
  themeLight:        { pt:"Claro", en:"Light", es:"Claro", fr:"Clair", de:"Hell", he:"בָּהִיר", ru:"Светлая" },
  themeDarkDesc:     { pt:"Noite de Jerusalém", en:"Jerusalem Night", es:"Noche de Jerusalén", fr:"Nuit de Jérusalem", de:"Jerusalemer Nacht", he:"לֵיל יְרוּשָׁלַיִם", ru:"Иерусалимская ночь" },
  themeLightDesc:    { pt:"Pergaminho da Torá", en:"Torah Parchment", es:"Pergamino de la Torá", fr:"Parchemin de la Torah", de:"Tora-Pergament", he:"קְלַף הַתּוֹרָה", ru:"Пергамент Торы" },
  activeTheme:       { pt:"ATIVO", en:"ACTIVE", es:"ACTIVO", fr:"ACTIF", de:"AKTIV", he:"פָּעִיל", ru:"АКТИВНО" },
  themePreview:      { pt:"Visualização do tema", en:"Theme preview", es:"Vista previa del tema", fr:"Aperçu du thème", de:"Themenvorschau", he:"תְּצוּגָה מְקַדֶּמֶת שֶׁל הַנוֹשֵׂא", ru:"Предпросмотр темы" },
  languageSection:   { pt:"Idioma", en:"Language", es:"Idioma", fr:"Langue", de:"Sprache", he:"שָׂפָה", ru:"Язык" },
  notifStatusOn:     { pt:"Notificações permitidas", en:"Notifications allowed", es:"Notificaciones permitidas", fr:"Notifications autorisées", de:"Benachrichtigungen erlaubt", he:"הוֹדָעוֹת מֻתָּרוֹת", ru:"Уведомления разрешены" },
  notifStatusOff:    { pt:"Notificações bloqueadas", en:"Notifications blocked", es:"Notificaciones bloqueadas", fr:"Notifications bloquées", de:"Benachrichtigungen blockiert", he:"הוֹדָעוֹת חֲסוּמוֹת", ru:"Уведомления заблокированы" },
  notifStatusAsk:    { pt:"Permissão necessária", en:"Permission needed", es:"Permiso necesario", fr:"Autorisation nécessaire", de:"Berechtigung erforderlich", he:"נִדְרֶשֶׁת הַרְשָׁאָה", ru:"Требуется разрешение" },
  notifStatusOnDesc: { pt:"O app pode enviar alertas. Configure cada tipo abaixo.", en:"The app can send alerts. Configure each type below.", es:"La app puede enviar alertas. Configura cada tipo abajo.", fr:"L'application peut envoyer des alertes. Configurez chaque type ci-dessous.", de:"Die App kann Benachrichtigungen senden. Konfiguriere jeden Typ unten.", he:"הָאַפְּלִיקַצְיָה יְכוֹלָה לִשְׁלֹחַ הַתְרָאוֹת. הַגְדֵּר כָּל סוּג לְמַטָּה.", ru:"Приложение может отправлять уведомления. Настройте каждый тип ниже." },
  notifStatusOffDesc:{ pt:"Acesse Configurações do navegador → Notificações → Permitir para este site.", en:"Go to Browser Settings → Notifications → Allow for this site.", es:"Ve a Configuración del navegador → Notificaciones → Permitir para este sitio.", fr:"Allez dans Paramètres du navigateur → Notifications → Autoriser pour ce site.", de:"Gehe zu Browser-Einstellungen → Benachrichtigungen → Für diese Seite erlauben.", he:"עֲבֹר לְהַגְדְּרוֹת הַדְּפַדְפָן → הוֹדָעוֹת → אַפְשֵׁר לְאֲתָר זֶה.", ru:"Перейдите в настройки браузера → Уведомления → Разрешить для этого сайта." },
  notifStatusAskDesc:{ pt:"Toque em Ativar para receber alertas de Shabat, Festas e mais.", en:"Tap Activate to receive alerts for Shabbat, Feasts and more.", es:"Toca Activar para recibir alertas de Shabat, Fiestas y más.", fr:"Appuyez sur Activer pour recevoir des alertes pour Chabbat, Fêtes et plus.", de:"Tippe auf Aktivieren, um Benachrichtigungen für Schabbat, Feste und mehr zu erhalten.", he:"הַקֵּשׁ עַל הַפְעֵל כְּדֵי לְקַבֵּל הַתְרָאוֹת עַל שַׁבָּת, מוֹעֲדִים360 וְעוֹד.", ru:"Нажмите «Включить», чтобы получать уведомления о Шаббате, праздниках и не только." },
  pleaseWait:        { pt:"Aguarde…", en:"Please wait…", es:"Espera…", fr:"Veuillez patienter…", de:"Bitte warten…", he:"אָנָּא הַמְתֵּן…", ru:"Пожалуйста, подождите…" },
  typesEnabled:      { pt:"Tipos habilitados", en:"Enabled types", es:"Tipos habilitados", fr:"Types activés", de:"Aktivierte Typen", he:"סוּגִים מֻפְעָלִים", ru:"Включённые типы" },
  activate:          { pt:"Ativar", en:"Activate", es:"Activar", fr:"Activer", de:"Aktivieren", he:"הַפְעֵל", ru:"Включить" },
  testNow:           { pt:"🔔 Testar agora", en:"🔔 Test now", es:"🔔 Probar ahora", fr:"🔔 Tester maintenant", de:"🔔 Jetzt testen", he:"🔔 בְּדֹק עַכְשָׁו", ru:"🔔 Проверить сейчас" },
  sentBtn:           { pt:"✓ Enviada!", en:"✓ Sent!", es:"✓ ¡Enviada!", fr:"✓ Envoyée!", de:"✓ Gesendet!", he:"✓ נִשְׁלַח!", ru:"✓ Отправлено!" },
  savedBadge:        { pt:"Salvo", en:"Saved", es:"Guardado", fr:"Enregistré", de:"Gespeichert", he:"נִשְׁמַר", ru:"Сохранено" },
  enableAllBtn:      { pt:"Ativar todas", en:"Enable all", es:"Activar todas", fr:"Activer tout", de:"Alle aktivieren", he:"הַפְעֵל הַכֹּל", ru:"Включить все" },
  disableAllBtn:     { pt:"Desativar todas", en:"Disable all", es:"Desactivar todas", fr:"Désactiver tout", de:"Alle deaktivieren", he:"כַּבֵּה הַכֹּל", ru:"Выключить все" },
  aboutApp:          { pt:"✡ Sobre o Calendário Moedim360", en:"✡ About the Moedim360 Calendar", es:"✡ Sobre el Calendario Moedim360", fr:"✡ À Propos du Calendrier Moedim360", de:"✡ Über den Moedim360-Kalender", he:"✡ אוֹדוֹת לוּחַ מוֹעֲדִים360", ru:"✡ О календаре Моэдим360" },

  // ── Textos de notificações (NOTIF_DEFS) ────────────────────────────
  notif_shabat_label:   { pt:"Shabat", en:"Shabbat", es:"Shabat", fr:"Chabbat", de:"Schabbat", he:"שַׁבָּת", ru:"Шаббат" },
  notif_shabat_when:    { pt:"Toda sexta-feira, 1h antes do pôr do sol", en:"Every Friday, 1h before sunset", es:"Cada viernes, 1h antes del atardecer", fr:"Chaque vendredi, 1h avant le coucher du soleil", de:"Jeden Freitag, 1 Std. vor Sonnenuntergang", he:"כָּל יוֹם שִׁישִׁי, שָׁעָה לִפְנֵי הַשְּׁקִיעָה", ru:"Каждую пятницу, за 1 час до заката" },
  notif_shabat_detail:  { pt:"Receba um alerta para preparar o coração, a mesa e acender as velas no tempo certo.", en:"Get an alert to prepare your heart, the table, and light candles at the right time.", es:"Recibe una alerta para preparar el corazón, la mesa y encender las velas a tiempo.", fr:"Recevez une alerte pour préparer votre cœur, la table et allumer les bougies au bon moment.", de:"Erhalte eine Erinnerung, um Herz, Tisch und Kerzen rechtzeitig vorzubereiten.", he:"קַבֵּל הַתְרָאָה לְהָכִין אֶת הַלֵּב, הַשֻּׁלְחָן וּלְהַדְלִיק נֵרוֹת בַּזְּמַן הַנָּכוֹן.", ru:"Получите напоминание, чтобы вовремя подготовить сердце, стол и зажечь свечи." },
  notif_shabat_verse:   { pt:"Êxodo 20:8 — Lembra do dia do Shabat para santificá-lo.", en:"Exodus 20:8 — Remember the Sabbath day, to keep it holy.", es:"Éxodo 20:8 — Acuérdate del día de reposo para santificarlo.", fr:"Exode 20:8 — Souviens-toi du jour du repos, pour le sanctifier.", de:"2. Mose 20:8 — Gedenke des Sabbattags, dass du ihn heiligest.", he:"שְׁמוֹת כ:ח — זָכוֹר אֶת יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ.", ru:"Исход 20:8 — Помни день субботний, чтобы святить его." },

  notif_feasts_label:   { pt:"Festas Bíblicas", en:"Biblical Feasts", es:"Fiestas Bíblicas", fr:"Fêtes Bibliques", de:"Biblische Feste", he:"מוֹעֲדִים360", ru:"Библейские праздники" },
  notif_feasts_when:    { pt:"3 dias antes de cada Moed (festa bíblica)", en:"3 days before each Moed (biblical feast)", es:"3 días antes de cada Moed (fiesta bíblica)", fr:"3 jours avant chaque Moed (fête biblique)", de:"3 Tage vor jedem Moed (biblisches Fest)", he:"3 יָמִים לִפְנֵי כָּל מוֹעֵד", ru:"За 3 дня до каждого Моэда (библейского праздника)" },
  notif_feasts_detail:  { pt:"Alertas para Pessach, Shavuot, Rosh Hashaná, Yom Kippur, Sukkot, Chanukah e Purim.", en:"Alerts for Passover, Shavuot, Rosh Hashanah, Yom Kippur, Sukkot, Chanukah and Purim.", es:"Alertas para Pesaj, Shavuot, Rosh Hashaná, Yom Kipur, Sucot, Janucá y Purim.", fr:"Alertes pour Pessah, Chavouot, Roch Hachana, Yom Kippour, Souccot, Hanoucca et Pourim.", de:"Erinnerungen für Pessach, Schawuot, Rosch Haschana, Jom Kippur, Sukkot, Chanukka und Purim.", he:"הַתְרָאוֹת לְפֶסַח, שָׁבוּעוֹת, רֹאשׁ הַשָּׁנָה, יוֹם כִּפּוּר, סֻכּוֹת, חֲנֻכָּה וּפוּרִים.", ru:"Напоминания о Песахе, Шавуоте, Рош ха-Шана, Йом Кипур, Суккот, Ханука и Пурим." },
  notif_feasts_verse:   { pt:"Levítico 23:2 — As festas do Senhor são convocações sagradas.", en:"Leviticus 23:2 — The feasts of the LORD are holy convocations.", es:"Levítico 23:2 — Las fiestas del Señor son santas convocaciones.", fr:"Lévitique 23:2 — Les fêtes de l'Éternel sont de saintes convocations.", de:"3. Mose 23:2 — Die Feste des HERRN sind heilige Versammlungen.", he:"וַיִּקְרָא כג:ב — מוֹעֲדֵי ה' מִקְרָאֵי קֹדֶשׁ.", ru:"Левит 23:2 — Праздники Господни — священные собрания." },

  notif_parasha_label:  { pt:"Parashat HaShavua", en:"Parashat HaShavua", es:"Parashat HaShavua", fr:"Parashat HaShavua", de:"Parashat HaShavua", he:"פָּרָשַׁת הַשָּׁבוּעַ", ru:"Парашат ха-Шавуа" },
  notif_parasha_when:   { pt:"Toda sexta-feira de manhã", en:"Every Friday morning", es:"Cada viernes por la mañana", fr:"Chaque vendredi matin", de:"Jeden Freitagmorgen", he:"כָּל בֹּקֶר יוֹם שִׁישִׁי", ru:"Каждое утро пятницы" },
  notif_parasha_detail: { pt:"O nome, a referência e o tema da porção semanal da Torá antes do Shabat.", en:"The name, reference and theme of the weekly Torah portion before Shabbat.", es:"El nombre, referencia y tema de la porción semanal de la Torá antes del Shabat.", fr:"Le nom, la référence et le thème de la portion hebdomadaire de la Torah avant Chabbat.", de:"Name, Referenz und Thema des wöchentlichen Toraabschnitts vor dem Schabbat.", he:"הַשֵּׁם, הַמַּרְאֶה מָקוֹם וְהַנּוֹשֵׂא שֶׁל הַפָּרָשָׁה הַשְּׁבוּעִית לִפְנֵי הַשַּׁבָּת.", ru:"Название, отрывок и тема недельной главы Торы перед Шаббатом." },
  notif_parasha_verse:  { pt:"Deuteronômio 17:19 — Leia nela todos os dias da sua vida.", en:"Deuteronomy 17:19 — Read it all the days of his life.", es:"Deuteronomio 17:19 — Leerá en él todos los días de su vida.", fr:"Deutéronome 17:19 — Il y lira tous les jours de sa vie.", de:"5. Mose 17:19 — Er soll darin lesen alle Tage seines Lebens.", he:"דְּבָרִים יז:יט — וְקָרָא בוֹ כָּל יְמֵי חַיָּיו.", ru:"Второзаконие 17:19 — Пусть читает его во все дни жизни своей." },

  notif_rosh_label:     { pt:"Rosh Chodesh", en:"Rosh Chodesh", es:"Rosh Chodesh", fr:"Rosh Chodesh", de:"Rosch Chodesch", he:"רֹאשׁ חֹדֶשׁ", ru:"Рош Ходеш" },
  notif_rosh_when:      { pt:"No início de cada mês hebraico (Lua Nova)", en:"At the start of each Hebrew month (New Moon)", es:"Al inicio de cada mes hebreo (Luna Nueva)", fr:"Au début de chaque mois hébraïque (Nouvelle Lune)", de:"Zu Beginn jedes hebräischen Monats (Neumond)", he:"בִּתְחִלַּת כָּל חֹדֶשׁ עִבְרִי", ru:"В начале каждого еврейского месяца (Новолуние)" },
  notif_rosh_detail:    { pt:"Seja alertado no início de cada mês — tempo de renovação espiritual e bênção.", en:"Be alerted at the start of each month — a time of spiritual renewal and blessing.", es:"Sé alertado al inicio de cada mes — tiempo de renovación espiritual y bendición.", fr:"Soyez alerté au début de chaque mois — un temps de renouveau spirituel et de bénédiction.", de:"Werde zu Beginn jedes Monats benachrichtigt — eine Zeit geistlicher Erneuerung und des Segens.", he:"קַבֵּל הַתְרָאָה בִּתְחִלַּת כָּל חֹדֶשׁ — זְמַן הִתְחַדְּשׁוּת רוּחָנִית וּבְרָכָה.", ru:"Получайте напоминание в начале каждого месяца — время духовного обновления и благословения." },
  notif_rosh_verse:     { pt:"Números 28:11 — No início de cada mês, ofertai ao Senhor.", en:"Numbers 28:11 — At the beginnings of your months, offer to the LORD.", es:"Números 28:11 — En los principios de vuestros meses, ofreceréis al Señor.", fr:"Nombres 28:11 — Au commencement de vos mois, vous offrirez à l'Éternel.", de:"4. Mose 28:11 — Am Anfang eurer Monate sollt ihr dem HERRN darbringen.", he:"בְּמִדְבַּר כח:יא — וּבְרָאשֵׁי חָדְשֵׁיכֶם תַּקְרִיבוּ לַה'.", ru:"Числа 28:11 — В новомесячия ваши приносите Господу." },

  sentBadge:         { pt:"Enviada!", en:"Sent!", es:"¡Enviada!", fr:"Envoyée!", de:"Gesendet!", he:"נִשְׁלַח!", ru:"Отправлено!" },
  testNowBtn:        { pt:"Testar agora", en:"Test now", es:"Probar ahora", fr:"Tester maintenant", de:"Jetzt testen", he:"בְּדֹק עַכְשָׁו", ru:"Проверить сейчас" },
  blockedHint:       { pt:"Bloqueado — habilite nas configurações do navegador", en:"Blocked — enable in browser settings", es:"Bloqueado — habilita en la configuración del navegador", fr:"Bloqué — activez dans les paramètres du navigateur", de:"Blockiert — in den Browsereinstellungen aktivieren", he:"חָסוּם — הַפְעֵל בְּהַגְדְּרוֹת הַדְּפַדְפָן", ru:"Заблокировано — включите в настройках браузера" },
  enableAboveHint:   { pt:"Ative as notificações acima para configurar", en:"Enable notifications above to configure", es:"Activa las notificaciones arriba para configurar", fr:"Activez les notifications ci-dessus pour configurer", de:"Aktiviere die Benachrichtigungen oben zum Konfigurieren", he:"הַפְעֵל אֶת הַהוֹדָעוֹת לְמַעְלָה כְּדֵי לְהַגְדִּיר", ru:"Включите уведомления выше для настройки" },
  enableAllBtn:      { pt:"Ativar todas", en:"Enable all", es:"Activar todas", fr:"Activer tout", de:"Alle aktivieren", he:"הַפְעֵל הַכֹּל", ru:"Включить все" },
  disableAllBtn:     { pt:"Desativar todas", en:"Disable all", es:"Desactivar todas", fr:"Désactiver tout", de:"Alle deaktivieren", he:"כַּבֵּה הַכֹּל", ru:"Выключить все" },
  encountersEternal: { pt:"Encontros Marcados pelo Eterno", en:"Appointed Encounters with the Eternal", es:"Encuentros Señalados por el Eterno", fr:"Rencontres Fixées par l'Éternel", de:"Festgesetzte Begegnungen mit dem Ewigen", he:"מוֹעֲדִים360 קְבוּעִים עִם הַנִּצְחִי", ru:"Назначенные встречи с Вечным" },
  featCalendar:      { pt:"Hebraico + gregoriano", en:"Hebrew + Gregorian", es:"Hebreo + gregoriano", fr:"Hébreu + grégorien", de:"Hebräisch + gregorianisch", he:"עִבְרִי + גְּרֵגוֹרְיָאנִי", ru:"Еврейский + григорианский" },
  featConverter:     { pt:"Com tribos de Israel", en:"With tribes of Israel", es:"Con tribus de Israel", fr:"Avec les tribus d'Israël", de:"Mit Stämmen Israels", he:"עִם שִׁבְטֵי יִשְׂרָאֵל", ru:"С коленами Израиля" },
  featParashah:      { pt:"Ciclo real 5786", en:"Real 5786 cycle", es:"Ciclo real 5786", fr:"Cycle réel 5786", de:"Echter Zyklus 5786", he:"מַחֲזוֹר אֲמִתִּי תשפ״ו", ru:"Настоящий цикл 5786" },
  featShabat:        { pt:"Horários por GPS", en:"GPS-based times", es:"Horarios por GPS", fr:"Horaires par GPS", de:"Zeiten per GPS", he:"זְמַנִּים לְפִי GPS", ru:"Время по GPS" },
  featFeasts:        { pt:"Moadim messiânicos", en:"Messianic Moadim", es:"Moadim mesiánicos", fr:"Moadim messianiques", de:"Messianische Moadim", he:"מוֹעֲדִים360 מְשִׁיחִיִּים", ru:"Мессианские Моадим" },
  featRosh:          { pt:"Fase lunar real", en:"Real moon phase", es:"Fase lunar real", fr:"Phase lunaire réelle", de:"Echte Mondphase", he:"שְׁלַב יָרֵחַ אֲמִתִּי", ru:"Настоящая фаза луны" },
  featVerse:         { pt:"30 versos em Heb+PT", en:"30 verses in Heb+PT", es:"30 versos en Heb+PT", fr:"30 versets en Héb+PT", de:"30 Verse auf Hebr+PT", he:"30 פְּסוּקִים בְּעִבְרִית וּפוֹרְטוּגֶזִית", ru:"30 стихов на иврите и португальском" },
  featSettings:      { pt:"Tema + notificações", en:"Theme + notifications", es:"Tema + notificaciones", fr:"Thème + notifications", de:"Thema + Benachrichtigungen", he:"נוֹשֵׂא + הוֹדָעוֹת", ru:"Тема + уведомления" },

  close:             { pt:"Fechar", en:"Close", es:"Cerrar", fr:"Fermer", de:"Schließen", he:"סְגֹר", ru:"Закрыть" },
  installApp:        { pt:"Instalar Moedim360", en:"Install Moedim360", es:"Instalar Moedim360", fr:"Installer Moedim360", de:"Moedim360 installieren", he:"הַתְקֵן אֶת מוֹעֲדִים360", ru:"Установить Моэдим360" },
  offlineAccess:     { pt:"Acesse offline a qualquer momento", en:"Access offline anytime", es:"Accede sin conexión en cualquier momento", fr:"Accédez hors ligne à tout moment", de:"Jederzeit offline zugreifen", he:"גִּשׁ לְלֹא חִבּוּר בְּכָל עֵת", ru:"Доступ офлайн в любое время" },
  installBtn:        { pt:"Instalar", en:"Install", es:"Instalar", fr:"Installer", de:"Installieren", he:"הַתְקֵן", ru:"Установить" },
  addToHomeScreen:   { pt:"Adicionar à tela inicial", en:"Add to home screen", es:"Añadir a la pantalla de inicio", fr:"Ajouter à l'écran d'accueil", de:"Zum Startbildschirm hinzufügen", he:"הוֹסֵף לְמַסֵּך הַבַּיִת", ru:"Добавить на главный экран" },
  installIosHint:    { pt:"Toque em Compartilhar e depois 'Adicionar à Tela de Início'", en:"Tap Share then 'Add to Home Screen'", es:"Toca Compartir y luego 'Añadir a pantalla de inicio'", fr:"Appuyez sur Partager puis 'Ajouter à l'écran d'accueil'", de:"Tippen Sie auf Teilen und dann 'Zum Startbildschirm hinzufügen'", he:"הַקֵּשׁ עַל שַׁתֵּף וְאַחַר כָּךְ 'הוֹסֵף לְמַסֵּך הַבַּיִת'", ru:"Нажмите Поделиться, затем 'Добавить на главный экран'" },
  installDesktopHint:{ pt:"Use Chrome, Edge ou Samsung Internet e clique no botão para instalar", en:"Use Chrome, Edge or Samsung Internet and click the button to install", es:"Usa Chrome, Edge o Samsung Internet y toca el botón para instalar", fr:"Utilisez Chrome, Edge ou Samsung Internet et appuyez sur le bouton pour installer", de:"Verwenden Sie Chrome, Edge oder Samsung Internet und tippen Sie zum Installieren auf die Schaltfläche", he:"השתמש ב-Chrome, Edge או Samsung Internet ולחץ על הכפתור להתקנה", ru:"Используйте Chrome, Edge или Samsung Internet и нажмите кнопку для установки" },


  notifFeastsTitle:  { pt:"Notificações de Festas", en:"Feast Notifications", es:"Notificaciones de Fiestas", fr:"Notifications de Fêtes", de:"Fest-Benachrichtigungen", he:"הוֹדָעוֹת מוֹעֲדִים360", ru:"Уведомления о праздниках" },
  notifFeastsDesc:   { pt:"Receba alertas sobre as festas bíblicas próximas", en:"Get alerts about upcoming biblical feasts", es:"Recibe alertas sobre las próximas fiestas bíblicas", fr:"Recevez des alertes sur les fêtes bibliques à venir", de:"Erhalte Benachrichtigungen über bevorstehende biblische Feste", he:"קַבֵּל הַתְרָאוֹת עַל מוֹעֲדִים360 מִקְרָאִיִּים קְרוֹבִים", ru:"Получайте уведомления о предстоящих библейских праздниках" },
  blockedInSettings: { pt:"Bloqueado nas configurações", en:"Blocked in settings", es:"Bloqueado en la configuración", fr:"Bloqué dans les paramètres", de:"In den Einstellungen blockiert", he:"חָסוּם בַּהַגְדָּרוֹת", ru:"Заблокировано в настройках" },
  feastApproaching:  { pt:"se aproxima!", en:"is approaching!", es:"¡se acerca!", fr:"approche!", de:"naht!", he:"מִתְקָרֵב!", ru:"приближается!" },
  feastTodayNotif:   { pt:"Esta festa é hoje! ", en:"This feast is today! ", es:"¡Esta fiesta es hoy! ", fr:"Cette fête est aujourd'hui! ", de:"Dieses Fest ist heute! ", he:"מוֹעֵד זֶה הַיּוֹם! ", ru:"Этот праздник сегодня! " },
  inDaysNotif:       { pt:"Em {n} dias:", en:"In {n} days:", es:"En {n} días:", fr:"Dans {n} jours:", de:"In {n} Tagen:", he:"בְּעוֹד {n} יָמִים:", ru:"Через {n} дней:" },

  shabatSectionSub:  { pt:"O sétimo dia é sagrado — um sinal eterno entre Deus e Seu povo", en:"The seventh day is holy — an eternal sign between God and His people", es:"El séptimo día es santo — una señal eterna entre Dios y Su pueblo", fr:"Le septième jour est saint — un signe éternel entre Dieu et Son peuple", de:"Der siebte Tag ist heilig — ein ewiges Zeichen zwischen Gott und Seinem Volk", he:"הַיּוֹם הַשְּׁבִיעִי קָדוֹשׁ — אוֹת עוֹלָם בֵּין אֱלֹהִים לְעַמּוֹ", ru:"Седьмой день свят — вечный знак между Богом и Его народом" },
  tonightAtSunset:   { pt:"Esta noite ao pôr do sol — prepare seu coração!", en:"Tonight at sunset — prepare your heart!", es:"Esta noche al atardecer — ¡prepara tu corazón!", fr:"Ce soir au coucher du soleil — préparez votre cœur!", de:"Heute Abend bei Sonnenuntergang — bereite dein Herz vor!", he:"הַלַּיְלָה עִם הַשְּׁקִיעָה — הָכֵן אֶת לִבְּךָ!", ru:"Сегодня вечером на закате — приготовьте своё сердце!" },
  untilShabatStart:  { pt:"até o início do Shabat", en:"until Shabbat begins", es:"hasta el inicio del Shabat", fr:"jusqu'au début du Chabbat", de:"bis der Sabbat beginnt", he:"עַד תְּחִלַּת הַשַּׁבָּת", ru:"до начала Шаббата" },
  calcLocalTimes:    { pt:"Calcular horários locais de Shabat", en:"Calculate local Shabbat times", es:"Calcular horarios locales de Shabat", fr:"Calculer les horaires locaux du Chabbat", de:"Lokale Sabbatzeiten berechnen", he:"חַשֵּׁב זְמַנֵּי שַׁבָּת מְקוֹמִיִּים", ru:"Рассчитать местное время Шаббата" },
  rememberShabatVerse:{ pt:"Lembra do dia do Shabat para santificá-lo.", en:"Remember the Sabbath day, to keep it holy.", es:"Acuérdate del día de reposo para santificarlo.", fr:"Souviens-toi du jour du repos, pour le sanctifier.", de:"Gedenke des Sabbattags, dass du ihn heiligest.", he:"זָכוֹר אֶת יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ.", ru:"Помни день субботний, чтобы святить его." },
  fourthCommandment: { pt:"O Quarto Mandamento", en:"The Fourth Commandment", es:"El Cuarto Mandamiento", fr:"Le Quatrième Commandement", de:"Das Vierte Gebot", he:"הַדִּבֵּר הָרְבִיעִי", ru:"Четвёртая заповедь" },
  whatScriptureSays: { pt:"O QUE DIZ A ESCRITURA", en:"WHAT SCRIPTURE SAYS", es:"LO QUE DICE LA ESCRITURA", fr:"CE QUE DIT L'ÉCRITURE", de:"WAS DIE SCHRIFT SAGT", he:"מַה שֶׁהַכָּתוּב אוֹמֵר", ru:"ЧТО ГОВОРИТ ПИСАНИЕ" },
  howToSanctify:     { pt:"COMO SANTIFICAR O SHABAT", en:"HOW TO SANCTIFY THE SABBATH", es:"CÓMO SANTIFICAR EL SHABAT", fr:"COMMENT SANCTIFIER LE CHABBAT", de:"WIE MAN DEN SABBAT HEILIGT", he:"כֵּיצַד לְקַדֵּשׁ אֶת הַשַּׁבָּת", ru:"КАК СВЯТИТЬ ШАББАТ" },
  priestlyBlessing:  { pt:"Bênção Sacerdotal do Shabat", en:"Priestly Blessing of Shabbat", es:"Bendición Sacerdotal del Shabat", fr:"Bénédiction Sacerdotale du Chabbat", de:"Priestersegen des Sabbats", he:"בִּרְכַּת כֹּהֲנִים לַשַּׁבָּת", ru:"Священническое благословение Шаббата" },
  priestlyBlessingText:{ pt:"O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e te dê graça; o Senhor volte o seu rosto para ti e te dê paz.", en:"The LORD bless you and keep you; the LORD make His face shine upon you and be gracious to you; the LORD lift up His countenance upon you and give you peace.", es:"El Señor te bendiga y te guarde; el Señor haga resplandecer su rostro sobre ti y tenga de ti misericordia; el Señor alce sobre ti su rostro y ponga en ti paz.", fr:"Que l'Éternel te bénisse et te garde! Que l'Éternel fasse luire sa face sur toi et t'accorde sa grâce! Que l'Éternel tourne sa face vers toi et te donne la paix!", de:"Der HERR segne dich und behüte dich; der HERR lasse sein Angesicht leuchten über dir und sei dir gnädig; der HERR hebe sein Angesicht über dich und gebe dir Frieden.", he:"יְבָרֶכְךָ ה' וְיִשְׁמְרֶךָ. יָאֵר ה' פָּנָיו אֵלֶיךָ וִיחֻנֶּךָּ. יִשָּׂא ה' פָּנָיו אֵלֶיךָ וְיָשֵׂם לְךָ שָׁלוֹם.", ru:"Да благословит тебя Господь и сохранит тебя! Да призрит на тебя Господь светлым лицем Своим и помилует тебя! Да обратит Господь лице Своё на тебя и даст тебе мир!" },
};

// Hook de tradução
function useT(lang) {
  return (key) => {
    const entry = T[key];
    if (!entry) return key;
    return entry[lang] || entry["pt"] || key;
  };
}

// Meses e dias da semana localizados
function getMonthsPT(lang) {
  return T[`months_${lang}`] || T.months_pt;
}
function getWeekdays(lang) {
  return T[`weekdays_${lang}`] || T.weekdays_pt;
}

const TABS = [
  { id: "calendar",    tKey: "nav_calendar",  icon: "calendar"  },
  { id: "converter",   tKey: "nav_converter", icon: "convert"   },
  { id: "parasha",     tKey: "nav_parasha",   icon: "scroll"    },
  { id: "shabat",      tKey: "nav_shabat",    icon: "candle"    },
  { id: "feasts",      tKey: "nav_feasts",    icon: "star"      },
  { id: "roshchodesh", tKey: "nav_moon",      icon: "moon"      },
  { id: "verse",       tKey: "nav_verse",     icon: "book"      },
  { id: "learn",       tKey: "nav_learn",     icon: "tribe"     },
  { id: "settings",    tKey: "nav_settings",  icon: "settings"  },
];

function Navigation({ active, setActive, lang, setLang }) {
  const t = useT(lang);
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleTabs = TABS.slice(0, 5);   // bottom nav shows first 5
  const moreTabs    = TABS.slice(5);       // rest in "More" menu

  return (
    <>
      {/* ── DESKTOP TOP NAV ── */}
      <nav className="desktop-nav" style={{
        position: "sticky", top: 0, zIndex: 200,
        background: S.navBg,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${S.navBorder}`,
      }}>
        {/* gold accent line top */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${S.gold}, ${S.goldLight}, ${S.gold}, transparent)` }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
            onClick={() => setActive("calendar")}>
            <MenorahLogo size={52} />
          </div>
          {/* Desktop tabs */}
          <div style={{ display: "flex", gap: 2, overflowX: "auto", minWidth: 0 }}>
            {TABS.map(tab => {
              const isActive = active === tab.id;
              return (
                <button key={tab.id} onClick={() => setActive(tab.id)} style={{
                  background: isActive ? S.goldBg : "transparent",
                  border: `1px solid ${isActive ? S.goldBorder : "transparent"}`,
                  color: isActive ? S.goldLight : S.textMuted,
                  borderRadius: 10, padding: "7px 13px",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.18s ease", letterSpacing: "0.01em",
                  fontFamily: "'Inter', sans-serif",
                }}>
                  <Icon name={tab.icon} size={14} color={isActive ? S.goldLight : S.textMuted} strokeWidth={isActive ? 2 : 1.5} />
                  {t(tab.tKey)}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: S.navBg,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderTop: `1px solid ${S.navBorder}`,
        display: "flex", alignItems: "stretch",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}>
        {/* gold accent line top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${S.gold}88, ${S.goldLight}88, ${S.gold}88, transparent)` }} />

        {visibleTabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <button key={tab.id} onClick={() => setActive(tab.id)} style={{
              flex: 1, background: "none", border: "none",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 3, padding: "10px 2px 8px", cursor: "pointer",
              position: "relative",
            }}>
              {/* active indicator */}
              {isActive && (
                <div style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: 28, height: 2, borderRadius: 2,
                  background: `linear-gradient(90deg, ${S.gold}, ${S.goldLight})`,
                }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: isActive ? S.goldBg : "transparent",
                border: `1px solid ${isActive ? S.goldBorder : "transparent"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.18s ease",
              }}>
                <Icon name={tab.icon} size={18}
                  color={isActive ? S.goldLight : S.textMuted}
                  strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.03em",
                color: isActive ? S.goldLight : S.textMuted,
                fontFamily: "'Inter', sans-serif",
                textTransform: "uppercase",
              }}>{t(tab.tKey)}</span>
            </button>
          );
        })}

        {/* More button */}
        <button onClick={() => setMenuOpen(o => !o)} style={{
          flex: 1, background: "none", border: "none",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 3, padding: "10px 2px 8px", cursor: "pointer", position: "relative",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: moreTabs.some(t => t.id === active) ? S.goldBg : "transparent",
            border: `1px solid ${moreTabs.some(t => t.id === active) ? S.goldBorder : "transparent"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="settings" size={18}
              color={moreTabs.some(t => t.id === active) ? S.goldLight : S.textMuted}
              strokeWidth={1.5} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: S.textMuted,
            fontFamily: "'Inter', sans-serif", textTransform: "uppercase" }}>{t("more")}</span>
        </button>

        {/* More menu popup */}
        {menuOpen && (
          <div className="slide-down" style={{
            position: "fixed", bottom: 76, left: 16, right: 16, zIndex: 300,
            background: S.navBg, backdropFilter: "blur(24px)",
            border: `1px solid ${S.goldBorder}`, borderRadius: 20,
            padding: 8, boxShadow: `0 -8px 40px rgba(0,0,0,0.4)`,
          }}>
            {moreTabs.map(tab => {
              const isActive = active === tab.id;
              return (
                <button key={tab.id} onClick={() => { setActive(tab.id); setMenuOpen(false); }} style={{
                  width: "100%", background: isActive ? S.goldBg : "transparent",
                  border: "none", borderRadius: 12, padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  color: isActive ? S.goldLight : S.textSub,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <Icon name={tab.icon} size={20} color={isActive ? S.goldLight : S.textMuted} />
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{t(tab.tKey)}</span>
                  {isActive && <Icon name="check" size={16} color={S.gold} style={{ marginLeft: "auto" }} />}
                </button>
              );
            })}
            <div style={{ marginTop: 4, borderTop: `1px solid ${S.divider}`, paddingTop: 8 }}>
              <button onClick={() => setMenuOpen(false)} style={{
                width: "100%", background: "transparent", border: "none",
                padding: "8px", color: S.textMuted, cursor: "pointer",
                fontSize: 12, fontFamily: "'Inter', sans-serif",
              }}>{t("close")}</button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

// ─── CALENDAR PAGE ────────────────────────────────────────────────────────────

function CalendarPage({ lang = "pt" }) {
  const t = useT(lang);
  const monthsLoc   = getMonthsPT(lang);
  const weekdaysLoc = getWeekdays(lang);

  // ── Hora hebraica: o dia começa às 18h ──────────────────────────
  const now            = new Date();
  const hebrewToday    = getHebrewCivilDate();       // D+1 se após 18h
  const inTransition   = isHebrewTransitionPeriod(); // true entre 18h-00h
  const today          = hebrewToday;                // alias para compatibilidade

  const [year,  setYear]   = useState(hebrewToday.getFullYear());
  const [month, setMonth]  = useState(hebrewToday.getMonth() + 1);
  const [selDay, setSelDay] = useState(null);

  const todayHeb       = useMemo(() => getTodayHebrew(), []);
  const days           = useMemo(() => getMonthDays(year, month), [year, month]);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const upcomingFeasts = useMemo(() => getUpcomingFeasts(60), []);
  const parasha        = useMemo(() => getCurrentParasha(), []);
  const dailyPortion   = useMemo(() => getDailyPortion(parasha, lang), [parasha, lang]);
  const nextRC         = useMemo(() => getNextRoshChodesh(), []);
  const moonPhase      = useMemo(() => getMoonPhase(), []);

  const prev    = () => month === 1  ? (setMonth(12), setYear(y=>y-1)) : setMonth(m=>m-1);
  const next    = () => month === 12 ? (setMonth(1),  setYear(y=>y+1)) : setMonth(m=>m+1);
  const goToday = () => { setYear(hebrewToday.getFullYear()); setMonth(hebrewToday.getMonth()+1); };

  // Data civil para exibição (dia gregoriano real, não ajustado)
  const localeMap = { pt:"pt-BR", en:"en-US", es:"es-ES", fr:"fr-FR", de:"de-DE", he:"he-IL", ru:"ru-RU" };
  const todayStr = now.toLocaleDateString(localeMap[lang] || "pt-BR", { weekday:"long", day:"numeric", month:"long" });

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "28px 16px 100px" }}>

      {/* ── Banner: dia hebraico avançou após 18h ── */}
      {inTransition && (
        <div className="fade-up" style={{
          background: "rgba(212,175,55,0.09)",
          border: `1px solid ${S.gold}44`,
          borderRadius: 14, padding: "10px 18px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>🌙</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 13 }}>
              {t("newHebrewDay")}
            </div>
            <div style={{ color: S.textMuted, fontSize: 11 }}>
              {t("newHebrewDayDesc")}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: S.gold, fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ color: S.textMuted, fontSize: 9, marginTop: 1 }}>{t("civilTime")}</div>
          </div>
        </div>
      )}

      {/* ══ HERO HEADER ══ */}
      <div className="fade-up" style={{
        background: S.isDark
          ? "linear-gradient(145deg, rgba(22,39,84,0.9) 0%, rgba(10,27,69,0.95) 100%)"
          : "linear-gradient(145deg, rgba(255,253,248,0.95) 0%, rgba(244,239,230,0.98) 100%)",
        border: `1px solid ${S.goldBorder}`,
        borderRadius: 24, padding: "28px 28px 24px",
        marginBottom: 20,
        boxShadow: S.isDark
          ? `0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${S.goldBorder}`
          : `0 4px 32px rgba(0,0,0,0.08)`,
        position: "relative", overflow: "hidden",
      }}>
        {/* subtle arch pattern */}
        <div style={{ position:"absolute", top:-60, right:-40, width:200, height:200,
          borderRadius:"50%", border:`1px solid ${S.goldBorder}`, opacity:0.3, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:-90, right:-70, width:280, height:280,
          borderRadius:"50%", border:`1px solid ${S.goldBorder}`, opacity:0.15, pointerEvents:"none" }}/>


        <div style={{ position:"relative", display:"flex", flexWrap:"wrap", gap:20, alignItems:"flex-start" }}>
          {/* Left: Hebrew date */}
          <div style={{ flex:"1 1 200px" }}>
            <div style={{ color:S.textMuted, fontSize:10, fontWeight:700, letterSpacing:"0.12em",
              textTransform:"uppercase", marginBottom:8 }}>{t("todayLabel")}</div>
            <div className="cinzel gold-shimmer" style={{ fontSize:34, fontWeight:900, lineHeight:1, marginBottom:4 }}>
              {todayHeb.day} de {todayHeb.monthName}
            </div>
            <div className="hebrew" style={{ fontSize:26, color:S.gold, lineHeight:1, marginBottom:8 }}>
              {todayHeb.monthNameHeb} {todayHeb.year}
            </div>
            <div style={{ color:S.textMuted, fontSize:13 }}>{todayStr}</div>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <InstallButton lang={lang} />
            </div>
            {inTransition && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(212,175,55,0.10)", border: `1px solid ${S.gold}44`,
                borderRadius: 20, padding: "3px 10px", marginTop: 8,
                fontSize: 10, color: S.gold,
              }}>
                <span>🌙</span>
                <span>{t("hebrewDayAdvanced")}</span>
              </div>
            )}
          </div>

          {/* Right: Quick info tiles */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {/* Parasha */}
            <div style={{ background:S.bgGlass, border:`1px solid ${S.goldBorder}`,
              borderRadius:16, padding:"12px 16px", minWidth:180 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <Icon name="scroll" size={13} color={S.gold} />
                <span style={{ color:S.textMuted, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>{t("parashatOfDay")}</span>
              </div>
              <div className="cinzel" style={{ color:S.goldLight, fontWeight:700, fontSize:14 }}>{parasha?.name}</div>
              <div className="hebrew" style={{ color:S.gold, fontSize:17, lineHeight:1 }}>{parasha?.heb}</div>
              {dailyPortion?.ref ? (
                <>
                  <div style={{ color:S.text, fontSize:11, fontWeight:700, marginTop:5, paddingTop:5, borderTop:`1px solid ${S.goldBorder}` }}>
                    📖 {dailyPortion.weekdayName} — {t("aliyahOf").replace("{n}", dailyPortion.aliyahNum)}
                  </div>
                  <div style={{ color:S.goldLight, fontSize:11, fontWeight:600, marginTop:1 }}>
                    {dailyPortion.ref}
                  </div>
                  <div style={{ color:S.textMuted, fontSize:9, marginTop:3 }}>
                    {t("fullWeekRef")}: {parasha?.ref}
                  </div>
                </>
              ) : (
                <div style={{ color:S.textMuted, fontSize:10, marginTop:2 }}>{parasha?.ref}</div>
              )}
              {parasha?.haftara && (
                <div style={{ color:S.textMuted, fontSize:9, marginTop:4, paddingTop:4, borderTop:`1px solid ${S.goldBorder}` }}>
                  🎵 {parasha.haftara}
                </div>
              )}
            </div>

            {/* Moon */}
            <div style={{ background:S.bgGlass, border:`1px solid ${S.goldBorder}`,
              borderRadius:16, padding:"12px 16px", minWidth:140 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <Icon name="moon" size={13} color="#a78bfa" />
                <span style={{ color:S.textMuted, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>{t("newMoon")}</span>
              </div>
              <div style={{ fontSize:28, lineHeight:1, marginBottom:4 }}>{getMoonEmoji(moonPhase)}</div>
              <div style={{ color:S.textSub, fontSize:11 }}>{getMoonPhaseName(moonPhase)}</div>
              {nextRC && <div style={{ color:"#a78bfa", fontSize:10, marginTop:3 }}>
                {Math.ceil((new Date(nextRC.date)-getHebrewCivilDate())/86400000)}d → {nextRC.month}
              </div>}
            </div>

            {/* Próxima festa */}
            {upcomingFeasts[0] && (
              <div style={{ background:S.goldBg, border:`1px solid ${S.goldBorder}`,
                borderRadius:16, padding:"12px 16px", minWidth:150 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <Icon name="star" size={13} color={S.gold} />
                  <span style={{ color:S.textMuted, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>{t("nextFeast")}</span>
                </div>
                <div className="cinzel" style={{ color:S.goldLight, fontWeight:700, fontSize:13 }}>{upcomingFeasts[0].feast.name}</div>
                <div className="hebrew" style={{ color:S.gold, fontSize:16 }}>{upcomingFeasts[0].feast.heb}</div>
                <div style={{ color:S.gold, fontSize:11, marginTop:3 }}>
                  {upcomingFeasts[0].daysAway === 0 ? t("todayBang") : upcomingFeasts[0].daysAway === 1 ? t("tomorrowBang") : t("inDays").replace("{n}", upcomingFeasts[0].daysAway)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ CALENDAR GRID ══ */}
      <GlassCard noPad style={{ marginBottom: 20 }}>
        {/* Month nav header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 22px 14px", borderBottom:`1px solid ${S.divider}` }}>
          <button onClick={prev} style={{
            width:36, height:36, borderRadius:10, border:`1px solid ${S.goldBorder}`,
            background:S.goldBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background=S.goldBorder}
            onMouseLeave={e=>e.currentTarget.style.background=S.goldBg}>
            <Icon name="chevL" size={18} color={S.gold} />
          </button>

          <div style={{ textAlign:"center" }}>
            <div className="cinzel" style={{ fontSize:20, fontWeight:700, color:S.text, letterSpacing:"0.04em" }}>
              {monthsLoc[month-1]} {year}
            </div>
            <button onClick={goToday} style={{
              background:"none", border:"none", color:S.gold, fontSize:11,
              cursor:"pointer", fontFamily:"'Inter',sans-serif", marginTop:2,
            }}>{t("goToToday")}</button>
          </div>

          <button onClick={next} style={{
            width:36, height:36, borderRadius:10, border:`1px solid ${S.goldBorder}`,
            background:S.goldBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.background=S.goldBorder}
            onMouseLeave={e=>e.currentTarget.style.background=S.goldBg}>
            <Icon name="chevR" size={18} color={S.gold} />
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"10px 14px 0" }}>
          {weekdaysLoc.map((d,i) => (
            <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700,
              color: i===6 ? S.gold : S.textMuted,
              letterSpacing:"0.06em", textTransform:"uppercase", paddingBottom:8 }}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, padding:"0 14px 18px" }}>
          {Array.from({length: firstDayOfWeek}).map((_,i) => <div key={`e${i}`}/>)}
          {days.map((di, idx) => {
            const isSat   = di.gregorianDate.getDay() === 6;
            const isSel   = selDay && selDay.gregorianDate.getTime() === di.gregorianDate.getTime();
            const isToday = di.isToday;
            const isErev  = di.isErev;   // véspera: dia greg atual após 18h
            return (
              <div key={idx}
                onClick={() => setSelDay(isSel ? null : di)}
                className={isToday ? "today-ring" : ""}
                style={{
                  aspectRatio:"1", borderRadius:12, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", cursor:"pointer",
                  position:"relative", transition:"all 0.15s ease",
                  background: isToday
                    ? `linear-gradient(135deg, ${S.gold}, ${S.goldLight})`
                    : isErev ? "rgba(212,175,55,0.07)"
                    : isSel ? S.goldBg
                    : di.hasFeast ? `${S.goldBg}`
                    : isSat ? S.shabat
                    : "transparent",
                  border: `1px solid ${
                    isToday ? S.gold
                    : isErev ? "rgba(212,175,55,0.30)"
                    : isSel ? S.goldBorder
                    : "transparent"
                  }`,
                }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = S.goldBg; }}
                onMouseLeave={e => { if (!isToday) e.currentTarget.style.background =
                  isSel ? S.goldBg : di.hasFeast ? S.goldBg : isErev ? "rgba(212,175,55,0.07)" : isSat ? S.shabat : "transparent"; }}
              >
                <span style={{
                  fontSize: 14, fontWeight: 700, lineHeight: 1,
                  color: isToday ? "#0A1B45" : S.text,
                  fontFamily: "'Inter', sans-serif",
                }}>{di.gregorianDate.getDate()}</span>
                <span style={{
                  fontSize: 8, lineHeight: 1, marginTop: 2,
                  color: isToday ? inkMid(0.75) : S.gold,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {di.hebrewDate.day} {di.hebrewDate.monthName.slice(0,3)}
                </span>
                {di.hasFeast && !isToday && (
                  <div style={{ position:"absolute", top:3, right:3, width:5, height:5,
                    borderRadius:"50%", background:S.goldLight,
                    boxShadow:`0 0 4px ${S.gold}` }} />
                )}
                {isErev && !isToday && (
                  <div style={{
                    position:"absolute", top:2, left:3,
                    fontSize:8, lineHeight:1, opacity:0.7,
                  }}>🌙</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected day panel */}
        {selDay && (
          <div className="fade-up" style={{ margin:"0 16px 18px",
            background:S.bgGlass, border:`1px solid ${S.goldBorder}`, borderRadius:16, padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div className="cinzel" style={{ color:S.goldLight, fontWeight:700, fontSize:15 }}>
                  {selDay.gregorianDate.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}
                </div>
                <div style={{ color:S.textSub, fontSize:12, marginTop:3 }}>
                  {selDay.hebrewDate.day} de {selDay.hebrewDate.monthName}{" "}
                  <span className="hebrew" style={{color:S.gold,fontSize:15}}>{selDay.hebrewDate.monthNameHeb}</span>
                  {" "} • {selDay.hebrewDate.year} AM
                </div>
              </div>
              <button onClick={()=>setSelDay(null)} style={{
                background:S.bgGlass, border:`1px solid ${S.divider}`,
                borderRadius:8, width:28, height:28, cursor:"pointer",
                color:S.textMuted, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
              }}>×</button>
            </div>
            {selDay.hasFeast && (
              <div style={{ marginTop:12, padding:"12px 14px",
                background:S.goldBg, borderRadius:12, border:`1px solid ${S.goldBorder}` }}>
                <div className="cinzel" style={{color:S.goldLight,fontWeight:700,fontSize:13,marginBottom:4}}>
                  {selDay.hasFeast.emoji} {selDay.hasFeast.name}
                </div>
                <div className="hebrew" style={{color:S.gold,fontSize:17,marginBottom:6}}>{selDay.hasFeast.heb}</div>
                <div style={{color:S.textSub,fontSize:12,lineHeight:1.6}}>{selDay.hasFeast.desc[lang] || selDay.hasFeast.desc.pt}</div>
                <div style={{color:S.gold,fontSize:11,marginTop:6,fontStyle:"italic"}}>📖 {selDay.hasFeast.scripture}</div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div style={{ padding:"12px 22px 16px", borderTop:`1px solid ${S.divider}`,
          display:"flex", gap:20, flexWrap:"wrap" }}>
          {[
            [S.gold,                     t("legendToday")],
            [S.goldLight,                t("legendFeast")],
            [`${S.gold}55`,              t("legendShabat")],
            ["rgba(212,175,55,0.30)",    t("legendErev")],
          ].map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:c,
                border: (l.includes("Erev")||l.includes("עֶרֶב")) ? "1px solid rgba(212,175,55,0.5)" : "none" }}/>
              <span style={{ color:S.textMuted, fontSize:11 }}>{l}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── PARASHA PAGE ─────────────────────────────────────────────────────────────

const BOOK_COLORS = {
  Bereshit:  { bg: "rgba(74,222,128,0.10)",  border: "rgba(74,222,128,0.30)",  label: "#4ade80" },
  Shemot:    { bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.30)",  label: "#60a5fa" },
  Vayikra:   { bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.30)",  label: "#fb923c" },
  Bamidbar:  { bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.30)", label: "#a78bfa" },
  Devarim:   { bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.30)",  label: "#fbbf24" },
};
const BOOK_EMOJI = { Bereshit: "🌱", Shemot: "🔥", Vayikra: "🕯️", Bamidbar: "🏕️", Devarim: "📜" };

function fmtDate(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

function ParashaPage({ lang = "pt" }) {
  const t = useT(lang);
  const localeMap = { pt:"pt-BR", en:"en-US", es:"es-ES", fr:"fr-FR", de:"de-DE", he:"he-IL", ru:"ru-RU" };
  const current  = useMemo(() => getCurrentParasha(), []);
  const nextP    = useMemo(() => getNextParasha(), []);
  const [search, setSearch]       = useState("");
  const [viewMode, setViewMode]   = useState("diaspora"); // "diaspora" | "israel"
  const [expanded, setExpanded]   = useState(null);
  const [bookFilter, setBookFilter] = useState("Todos");

  const now = new Date();
  const daysUntilShabat = (6 - now.getDay() + 7) % 7 || 7;
  const nextShabatDate  = new Date(now); nextShabatDate.setDate(now.getDate() + daysUntilShabat);
  const nextShabatStr   = nextShabatDate.toLocaleDateString(localeMap[lang] || "pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  const BOOKS = ["Todos", "Bereshit", "Shemot", "Vayikra", "Bamidbar", "Devarim"];

  const filtered = PARASHOT_5786.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q)
      || p.theme.toLowerCase().includes(q) || (p.haftara || "").toLowerCase().includes(q)
      || (p.brit || "").toLowerCase().includes(q);
    const matchBook = bookFilter === "Todos" || p.book === bookFilter;
    return matchSearch && matchBook;
  });

  // Shabatot especiais desta semana
  const shabatEsp = SHABATOT_ESPECIAIS.find(s => {
    const sd = new Date(s.date);
    const diff = (sd - now) / 86400000;
    return diff >= -1 && diff <= 7;
  });

  const isCurrent = (p) => p.name === current?.name;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 100px" }}>
      <SectionTitle sub={t("parashaHeaderSub")}>Parashat HaShavua</SectionTitle>

      {/* ── HERO: porção atual ── */}
      {current && (
        <div className="fade-up" style={{
          background: `linear-gradient(135deg, ${inkMid(0.85)} 0%, rgba(212,168,67,0.08) 100%)`,
          border: `1px solid ${S.gold}66`, borderRadius: 20, padding: "24px 28px",
          marginBottom: 16, position: "relative", overflow: "hidden",
        }}>
          {/* decorative bg text */}
          <div style={{ position:"absolute", top:-10, right:0, fontSize:110, opacity:0.03,
            fontFamily:"'Frank Ruhl Libre',serif", lineHeight:1 }}>תּוֹרָה</div>

          <div style={{ position: "relative" }}>
            {/* badges row */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              <Badge color={S.goldLight}>{t("thisWeekBadge")}</Badge>
              <Badge color={BOOK_COLORS[current.book]?.label || S.gold}>
                {BOOK_EMOJI[current.book]} {current.book}
              </Badge>
              {current.double && <Badge color="#fb923c">{t("doublePortionBadge")}</Badge>}
              {shabatEsp && <Badge color="#a78bfa">✨ {shabatEsp.name}</Badge>}
            </div>

            {/* title */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:20, flexWrap:"wrap", marginBottom:16 }}>
              <div>
                <h2 className="display-font" style={{ fontSize:38, fontWeight:900, color:S.goldLight, lineHeight:1, marginBottom:4 }}>
                  {current.name}
                </h2>
                <div className="hebrew" style={{ fontSize:30, color:S.gold, lineHeight:1 }}>{current.heb}</div>
              </div>
              <div style={{ paddingTop:6 }}>
                <div style={{ color:S.text, fontWeight:600, fontSize:15 }}>{current.theme}</div>
                <div style={{ color:S.textMuted, fontSize:13, marginTop:4 }}>
                  {t("torahLabelIcon")} <strong style={{color:S.text}}>{current.ref}</strong>
                </div>
                <div style={{ color:S.textMuted, fontSize:13 }}>
                  {t("haftaraLabelIcon")} <strong style={{color:S.text}}>{current.haftara}</strong>
                </div>
                {current.brit && (
                  <div style={{ color:S.textMuted, fontSize:13 }}>
                    {t("britLabelIcon")} <strong style={{color:S.text}}>{current.brit}</strong>
                  </div>
                )}
                <div style={{ color:S.textMuted, fontSize:12, marginTop:4 }}>
                  {t("shabatLabelIcon")} <strong style={{color:S.gold}}>{fmtDate(current.dataDiaspora)}</strong>
                  {" "}• {current.hebrewDate}
                </div>
              </div>
            </div>

            {/* Israel vs Diáspora diff */}
            {current.diffIsrael && (
              <div style={{ background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.3)",
                borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
                <div style={{ color:"#a78bfa", fontWeight:700, fontSize:12, marginBottom:6 }}>
                  {t("israelDiasporaDiff")}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ background:ink(0.4), borderRadius:8, padding:"8px 12px" }}>
                    <div style={{ color:"#60a5fa", fontSize:10, fontWeight:700, marginBottom:3 }}>{t("israelBadge")}</div>
                    {current.israelReading && <>
                      <div style={{ color:S.text, fontWeight:600, fontSize:13 }}>{current.israelReading.name}</div>
                      <div style={{ color:S.textMuted, fontSize:11 }}>{current.israelReading.ref}</div>
                      <div style={{ color:S.textMuted, fontSize:11 }}>Haf: {current.israelReading.haftara}</div>
                      <div style={{ color:S.gold, fontSize:11 }}>📅 {fmtDate(current.israelReading.date)}</div>
                    </>}
                    {current.israelReading2 && <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ color:S.text, fontWeight:600, fontSize:13 }}>{current.israelReading2.name}</div>
                      <div style={{ color:S.textMuted, fontSize:11 }}>{current.israelReading2.ref}</div>
                      <div style={{ color:S.textMuted, fontSize:11 }}>Haf: {current.israelReading2.haftara}</div>
                      <div style={{ color:S.gold, fontSize:11 }}>📅 {fmtDate(current.israelReading2.date)}</div>
                    </div>}
                  </div>
                  <div style={{ background:ink(0.4), borderRadius:8, padding:"8px 12px" }}>
                    <div style={{ color:"#4ade80", fontSize:10, fontWeight:700, marginBottom:3 }}>{t("diasporaBadge")}</div>
                    <div style={{ color:S.text, fontWeight:600, fontSize:13 }}>{current.name}</div>
                    <div style={{ color:S.textMuted, fontSize:11 }}>{current.ref}</div>
                    <div style={{ color:S.textMuted, fontSize:11 }}>Haf: {current.haftara}</div>
                    <div style={{ color:S.gold, fontSize:11 }}>📅 {fmtDate(current.dataDiaspora)}</div>
                  </div>
                </div>
                {current.nota && <div style={{ color:"#a78bfa", fontSize:11, marginTop:8, fontStyle:"italic" }}>ℹ️ {current.nota}</div>}
              </div>
            )}

            {/* Shabat especial nota */}
            {shabatEsp && (
              <div style={{ background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.25)",
                borderRadius:10, padding:"8px 12px", marginBottom:12, fontSize:12, color:"#c4b5fd" }}>
                ✨ <strong>{shabatEsp.name}</strong> — {shabatEsp.nota}
              </div>
            )}

            {/* Next shabat countdown */}
            <div style={{ background:ink(0.5), borderRadius:10, padding:"10px 14px",
              fontSize:12, color:S.textMuted, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span>🕯️</span>
              <span>{t("nextShabatCountdown")} <strong style={{color:S.gold}}>{nextShabatStr}</strong></span>
              <span style={{ color:S.goldBorder }}>•</span>
              <span>{t("nextReading")} <strong style={{color:S.text}}>{nextP?.name}</strong> ({nextP?.ref})</span>
            </div>
          </div>
        </div>
      )}

      {/* ── PRÓXIMA SEMANA ── */}
      {nextP && (
        <div style={{ background:S.bgCard, border:`1px solid ${S.goldBorder}`, borderRadius:14,
          padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div style={{ fontSize:28 }}>📜</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:S.textMuted, marginBottom:3 }}>{t("nextWeekBadge")} {fmtDate(nextP.dataDiaspora)}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ color:S.text, fontWeight:700, fontSize:15 }}>{nextP.name}</span>
              <span className="hebrew" style={{ color:S.gold, fontSize:20 }}>{nextP.heb}</span>
              {nextP.double && <Badge color="#fb923c">⚡ {t("doublePortion")}</Badge>}
            </div>
            <div style={{ color:S.textMuted, fontSize:12, marginTop:2 }}>
              📚 {nextP.ref} &nbsp;•&nbsp; 🎵 {nextP.haftara}
            </div>
            {nextP.brit && (
              <div style={{ color:S.textMuted, fontSize:12 }}>
                {t("britLabelIcon")} {nextP.brit}
              </div>
            )}
            <div style={{ color:S.textMuted, fontSize:12 }}>{nextP.theme}</div>
          </div>
        </div>
      )}

      {/* ── TOGGLE MODO Israel/Diáspora ── */}
      <div style={{ display:"flex", background:S.bgCard, border:`1px solid ${S.goldBorder}`,
        borderRadius:12, padding:4, marginBottom:16, gap:4 }}>
        {[["diaspora",t("modeDiaspora")],["israel",t("modeIsrael")]].map(([id,label]) => (
          <button key={id} onClick={() => setViewMode(id)} style={{
            flex:1, background: viewMode===id ? S.goldBg : "transparent",
            border:"none", color: viewMode===id ? S.goldLight : S.textMuted,
            borderRadius:8, padding:"8px 4px", fontSize:13, fontWeight:600, cursor:"pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* ── FILTROS POR LIVRO ── */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {BOOKS.map(b => (
          <button key={b} onClick={() => setBookFilter(b)} style={{
            background: bookFilter===b ? (BOOK_COLORS[b]?.bg || S.goldBg) : S.bgCard,
            border: `1px solid ${bookFilter===b ? (BOOK_COLORS[b]?.border || S.goldBorder) : S.goldBorder}`,
            color: bookFilter===b ? (BOOK_COLORS[b]?.label || S.goldLight) : S.textMuted,
            borderRadius:20, padding:"4px 14px", fontSize:12, fontWeight:600, cursor:"pointer",
          }}>
            {b !== "Todos" && BOOK_EMOJI[b] + " "}{b === "Todos" ? t("filterAll") : b}
          </button>
        ))}
      </div>

      {/* ── BUSCA ── */}
      <div style={{ marginBottom:16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t("searchParasha")}
          style={{ width:"100%", background:S.bgCard, border:`1px solid ${S.goldBorder}`,
            borderRadius:10, padding:"10px 16px", color:S.text, fontSize:14, outline:"none" }}
        />
      </div>

      {/* ── LISTA COMPLETA ── */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {filtered.map(p => {
          const bc   = BOOK_COLORS[p.book] || {};
          const isCur = isCurrent(p);
          const isExp = expanded === p.num;

          // Data a exibir segundo o modo
          const displayDate = (viewMode === "israel" && p.dataIsrael) ? p.dataIsrael : p.dataDiaspora;

          return (
            <div key={p.num} onClick={() => setExpanded(isExp ? null : p.num)} style={{
              background: isCur ? S.goldBg : S.bgCard,
              border: `1px solid ${isCur ? S.gold : (isExp ? bc.border || S.goldBorder : S.goldBorder)}`,
              borderRadius:13, padding:"14px 16px", cursor:"pointer", transition:"all 0.18s",
            }}
              onMouseEnter={e => { if(!isCur) e.currentTarget.style.background = S.bgCardHover; }}
              onMouseLeave={e => { if(!isCur) e.currentTarget.style.background = isExp ? S.bgCard : S.bgCard; }}
            >
              {/* ── linha resumo ── */}
              <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                {/* número */}
                <div style={{ minWidth:32, height:32, borderRadius:8, background: bc.bg||S.goldBg,
                  border:`1px solid ${bc.border||S.goldBorder}`, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:11, fontWeight:700, color: bc.label||S.gold, flexShrink:0 }}>
                  {p.num}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:2 }}>
                    <span style={{ color: isCur ? S.goldLight : S.text, fontWeight:700, fontSize:15 }}>{p.name}</span>
                    <span className="hebrew" style={{ color:S.gold, fontSize:19 }}>{p.heb}</span>
                    {isCur && <Badge color={S.goldLight}>{t("currentBadge")}</Badge>}
                    {p.double && <Badge color="#fb923c">⚡ {t("doublePortion")}</Badge>}
                    {p.nota && p.nota.includes("Shabat") && !p.nota.includes("Porção") && (
                      <Badge color="#a78bfa">✨</Badge>
                    )}
                  </div>
                  <div style={{ color:S.textMuted, fontSize:12 }}>
                    📚 {p.ref}
                    {displayDate && <span style={{ color:S.gold, marginLeft:8 }}>📅 {fmtDate(displayDate)}</span>}
                    {p.diffIsrael && viewMode==="israel" && p.dataIsrael && (
                      <span style={{ color:"#a78bfa", marginLeft:6, fontSize:11 }}>🇮🇱 {t("diffDate") || "data diferente"}</span>
                    )}
                  </div>
                  <div style={{ color:S.textMuted, fontSize:12 }}>{p.theme}</div>
                </div>

                <span style={{ color:S.textMuted, fontSize:16, flexShrink:0 }}>{isExp ? "▲" : "▼"}</span>
              </div>

              {/* ── detalhe expandido ── */}
              {isExp && (
                <div className="fade-up" style={{ marginTop:14, paddingTop:14,
                  borderTop:`1px solid ${S.goldBorder}` }}>

                  {/* Grid leitura */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:10, marginBottom:12 }}>
                    {/* Torá */}
                    <div style={{ background:ink(0.45), borderRadius:10, padding:"10px 14px" }}>
                      <div style={{ color:S.gold, fontSize:10, fontWeight:700, marginBottom:4 }}>{t("torahLabelIcon")}</div>
                      <div style={{ color:S.text, fontWeight:600, fontSize:14 }}>{p.name}</div>
                      <div className="hebrew" style={{ color:S.gold, fontSize:18 }}>{p.heb}</div>
                      <div style={{ color:S.textMuted, fontSize:12, marginTop:2 }}>{p.ref}</div>
                    </div>
                    {/* Haftará */}
                    <div style={{ background:ink(0.45), borderRadius:10, padding:"10px 14px" }}>
                      <div style={{ color:"#60a5fa", fontSize:10, fontWeight:700, marginBottom:4 }}>{t("haftaraLabelIcon")}</div>
                      <div style={{ color:S.text, fontSize:13, lineHeight:1.5 }}>{p.haftara}</div>
                    </div>
                    {/* B'rit Chadashá */}
                    {p.brit && (
                      <div style={{ background:ink(0.45), borderRadius:10, padding:"10px 14px" }}>
                        <div style={{ color:"#4ade80", fontSize:10, fontWeight:700, marginBottom:4 }}>{t("britLabelIcon")}</div>
                        <div style={{ color:S.text, fontSize:13, lineHeight:1.5 }}>{p.brit}</div>
                      </div>
                    )}
                  </div>

                  {/* Datas Israel vs Diáspora */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                    <div style={{ background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.2)",
                      borderRadius:10, padding:"8px 12px" }}>
                      <div style={{ color:"#60a5fa", fontSize:10, fontWeight:700, marginBottom:3 }}>{t("israelBadge")}</div>
                      {p.diffIsrael && p.israelReading ? (
                        <>
                          <div style={{ color:S.text, fontWeight:600, fontSize:13 }}>{p.israelReading.name}</div>
                          <div style={{ color:S.textMuted, fontSize:11 }}>{p.israelReading.ref}</div>
                          <div style={{ color:S.textMuted, fontSize:11 }}>Haf: {p.israelReading.haftara}</div>
                          <div style={{ color:S.gold, fontSize:12, marginTop:2 }}>📅 {fmtDate(p.israelReading.date)}</div>
                          {p.israelReading2 && (
                            <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                              <div style={{ color:S.text, fontWeight:600, fontSize:13 }}>{p.israelReading2.name}</div>
                              <div style={{ color:S.textMuted, fontSize:11 }}>{p.israelReading2.ref}</div>
                              <div style={{ color:S.textMuted, fontSize:11 }}>Haf: {p.israelReading2.haftara}</div>
                              <div style={{ color:S.gold, fontSize:12, marginTop:2 }}>📅 {fmtDate(p.israelReading2.date)}</div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div style={{ color:S.text, fontWeight:600, fontSize:13 }}>{p.name}</div>
                          <div style={{ color:S.textMuted, fontSize:11 }}>{p.ref}</div>
                          <div style={{ color:S.gold, fontSize:12, marginTop:2 }}>📅 {fmtDate(p.dataIsrael || p.dataDiaspora)}</div>
                        </>
                      )}
                    </div>
                    <div style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)",
                      borderRadius:10, padding:"8px 12px" }}>
                      <div style={{ color:"#4ade80", fontSize:10, fontWeight:700, marginBottom:3 }}>{t("diasporaBadge")}</div>
                      <div style={{ color:S.text, fontWeight:600, fontSize:13 }}>{p.name}</div>
                      <div style={{ color:S.textMuted, fontSize:11 }}>{p.ref}</div>
                      <div style={{ color:S.textMuted, fontSize:11 }}>Haf: {p.haftara}</div>
                      <div style={{ color:S.gold, fontSize:12, marginTop:2 }}>📅 {fmtDate(p.dataDiaspora)}</div>
                    </div>
                  </div>

                  {/* Notas especiais */}
                  {p.nota && (
                    <div style={{ background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)",
                      borderRadius:10, padding:"8px 12px", fontSize:12, color:"#c4b5fd" }}>
                      ✨ {p.nota}
                    </div>
                  )}

                  {/* Data hebraica */}
                  <div style={{ marginTop:10, color:S.textMuted, fontSize:11, textAlign:"right" }}>
                    {p.hebrewDate} • 5786
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:40, color:S.textMuted, fontSize:14 }}>
          {t("noParashaFound")} "{search}"
        </div>
      )}
    </div>
  );
}

// ─── SHABAT PAGE ──────────────────────────────────────────────────────────────

const SHABAT_TEACHINGS = [
  {
    title: { pt:"O Quarto Mandamento", en:"The Fourth Commandment", es:"El Cuarto Mandamiento", fr:"Le Quatrième Commandement", de:"Das Vierte Gebot", he:"הַדִּבֵּר הָרְבִיעִי", ru:"Четвёртая заповедь" },
    heb: "זָכוֹר אֶת יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ",
    hebTrans: "Zachor et yom haShabbat lekadsho",
    text: {
      pt:"Lembra do dia do Shabat para santificá-lo. Seis dias trabalharás e farás toda a tua obra; mas o sétimo dia é o Shabat do Senhor teu Deus.",
      en:"Remember the Sabbath day, to keep it holy. Six days you shall labor and do all your work, but the seventh day is the Sabbath of the LORD your God.",
      es:"Acuérdate del día de reposo para santificarlo. Seis días trabajarás y harás toda tu obra; mas el séptimo día es el reposo para el Señor tu Dios.",
      fr:"Souviens-toi du jour du repos, pour le sanctifier. Tu travailleras six jours, et tu feras tout ton ouvrage. Mais le septième jour est le jour du repos de l'Éternel, ton Dieu.",
      de:"Gedenke des Sabbattags, dass du ihn heiligest. Sechs Tage sollst du arbeiten und alle deine Werke tun; aber am siebenten Tage ist der Sabbat des HERRN, deines Gottes.",
      he:"זָכוֹר אֶת יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ. שֵׁשֶׁת יָמִים תַּעֲבֹד וְעָשִׂיתָ כָּל מְלַאכְתֶּךָ, וְיוֹם הַשְּׁבִיעִי שַׁבָּת לַה' אֱלֹהֶיךָ.",
      ru:"Помни день субботний, чтобы святить его. Шесть дней работай и делай всякие дела твои, а день седьмой — суббота Господу Богу твоему.",
    },
    ref: "Êxodo 20:8-10",
    icon: "📜",
    color: "#D4AF37",
  },
  {
    title: { pt:"O Descanso de Deus", en:"God's Rest", es:"El Descanso de Dios", fr:"Le Repos de Dieu", de:"Gottes Ruhe", he:"מְנוּחַת הָאֱלֹהִים", ru:"Покой Бога" },
    heb: "וַיִּשְׁבֹּת בַּיּוֹם הַשְּׁבִיעִי",
    hebTrans: "Vayishbot bayom hashevi'i",
    text: {
      pt:"E Deus abençoou o sétimo dia e o santificou; porque nele descansou de toda a sua obra que Deus criara e fizera.",
      en:"And God blessed the seventh day and sanctified it, because on it He rested from all His work which God had created and made.",
      es:"Y bendijo Dios al día séptimo, y lo santificó, porque en él reposó de toda su obra que había creado y hecho.",
      fr:"Dieu bénit le septième jour, et il le sanctifia, parce qu'en ce jour il se reposa de toute son œuvre qu'il avait créée en la faisant.",
      de:"Und Gott segnete den siebenten Tag und heiligte ihn, weil er an ihm ruhte von allen seinen Werken, die Gott geschaffen und gemacht hatte.",
      he:"וַיְבָרֶךְ אֱלֹהִים אֶת יוֹם הַשְּׁבִיעִי וַיְקַדֵּשׁ אֹתוֹ, כִּי בוֹ שָׁבַת מִכָּל מְלַאכְתּוֹ.",
      ru:"И благословил Бог седьмой день, и освятил его, ибо в оный почил от всех дел Своих.",
    },
    ref: "Gênesis 2:2-3",
    icon: "🌅",
    color: "#F2D16B",
  },
  {
    title: { pt:"Sinal Eterno da Aliança", en:"Eternal Sign of the Covenant", es:"Señal Eterna del Pacto", fr:"Signe Éternel de l'Alliance", de:"Ewiges Zeichen des Bundes", he:"אוֹת בְּרִית עוֹלָם", ru:"Вечный знак завета" },
    heb: "בֵּינִי וּבֵין בְּנֵי יִשְׂרָאֵל אוֹת הִוא לְעֹלָם",
    hebTrans: "Beini uvein bnei Yisrael ot hi le'olam",
    text: {
      pt:"É sinal entre mim e os filhos de Israel para sempre; porque em seis dias fez o Senhor os céus e a terra, e ao sétimo dia descansou e tomou fôlego.",
      en:"It is a sign between Me and the children of Israel forever; for in six days the LORD made the heavens and the earth, and on the seventh day He rested and was refreshed.",
      es:"Señal es para siempre entre mí y los hijos de Israel; porque en seis días hizo el Señor los cielos y la tierra, y en el séptimo día cesó y reposó.",
      fr:"Ce sera entre moi et les enfants d'Israël un signe à perpétuité; car en six jours l'Éternel a fait les cieux et la terre, et le septième jour il a cessé son œuvre et il s'est reposé.",
      de:"Er ist ein ewiges Zeichen zwischen mir und den Israeliten; denn in sechs Tagen machte der HERR Himmel und Erde, aber am siebenten Tage ruhte er und erquickte sich.",
      he:"בֵּינִי וּבֵין בְּנֵי יִשְׂרָאֵל אוֹת הִוא לְעֹלָם, כִּי שֵׁשֶׁת יָמִים עָשָׂה ה' אֶת הַשָּׁמַיִם וְאֶת הָאָרֶץ.",
      ru:"Это — знамение между Мною и сынами Израилевыми на веки, потому что в шесть дней сотворил Господь небо и землю, а в день седьмой почил и покоился.",
    },
    ref: "Êxodo 31:17",
    icon: "✡",
    color: "#6EA8FE",
  },
  {
    title: { pt:"Descanso em Yeshua", en:"Rest in Yeshua", es:"Descanso en Yeshúa", fr:"Repos en Yeshua", de:"Ruhe in Jeschua", he:"מְנוּחָה בְּיֵשׁוּעַ", ru:"Покой в Йешуа" },
    heb: "אָפוֹא שַׁבָּτισμός לְעַם הָאֱלֹהִים",
    hebTrans: "Apoa shabbatismos le'am haElohim",
    text: {
      pt:"Portanto, fica em pé um repouso sabático para o povo de Deus. Pois aquele que entrou no seu repouso, ele mesmo também descansou das suas obras, como Deus das suas.",
      en:"There remains therefore a rest for the people of God. For he who has entered His rest has himself also ceased from his works as God did from His.",
      es:"Por tanto, queda un reposo para el pueblo de Dios. Porque el que ha entrado en su reposo, también ha reposado de sus obras, como Dios de las suyas.",
      fr:"Il y a donc un repos réservé au peuple de Dieu. Car celui qui entre dans le repos de Dieu se repose de ses œuvres, comme Dieu s'est reposé des siennes.",
      de:"Es ist also noch eine Ruhe vorhanden dem Volk Gottes. Denn wer zu seiner Ruhe gekommen ist, der ruht auch von seinen Werken, gleichwie Gott von seinen.",
      he:"עַל כֵּן נִשְׁאֲרָה מְנוּחַת שַׁבָּת לְעַם הָאֱלֹהִים, כִּי הַבָּא אֶל מְנוּחָתוֹ, גַּם הוּא שָׁבַת מִמַּעֲשָׂיו.",
      ru:"Посему для народа Божия еще остается субботство. Ибо, кто вошел в покой Его, тот и сам успокоился от дел своих, как и Бог от Своих.",
    },
    ref: "Hebreus 4:9-10",
    icon: "🕊️",
    color: "#A78BFA",
  },
  {
    title: { pt:"Yeshua e o Shabat", en:"Yeshua and the Sabbath", es:"Yeshúa y el Shabat", fr:"Yeshua et le Chabbat", de:"Jeschua und der Sabbat", he:"יֵשׁוּעַ וְהַשַּׁבָּת", ru:"Йешуа и Шаббат" },
    heb: "כִּי קִרְיֵא כָּבוֹד הַשַּׁבָּת",
    hebTrans: "Ki kire kavod haShabbat",
    text: {
      pt:"E entrou na sinagoga no dia do Shabat e se levantou para ler. E foi-lhe dado o rolo do profeta Isaías. Yeshua guardava e ensinava no Shabat.",
      en:"And He entered the synagogue on the Sabbath day and stood up to read. And the scroll of the prophet Isaiah was given to Him. Yeshua kept and taught on the Sabbath.",
      es:"Y entró en la sinagoga en el día de reposo, y se levantó a leer. Y se le dio el libro del profeta Isaías. Yeshúa guardaba y enseñaba en el Shabat.",
      fr:"Il entra dans la synagogue au jour du sabbat, et se leva pour faire la lecture. On lui remit le livre du prophète Ésaïe. Yeshua gardait et enseignait le Chabbat.",
      de:"Und er kam nach Nazareth und ging am Sabbat in die Synagoge und stand auf zu lesen. Und ihm wurde das Buch des Propheten Jesaja gereicht.",
      he:"וַיָּבֹא אֶל בֵּית הַכְּנֶסֶת בְּיוֹם הַשַּׁבָּת וַיָּקָם לִקְרֹא, וַיִּנָּתֵן לוֹ סֵפֶר יְשַׁעְיָהוּ הַנָּבִיא.",
      ru:"И пришел в синагогу в день субботний, и встал читать. Ему подали книгу пророка Исаии. Йешуа хранил и учил в субботу.",
    },
    ref: "Lucas 4:16-17",
    icon: "📖",
    color: "#34D399",
  },
  {
    title: { pt:"Como Santificar o Sétimo Dia", en:"How to Sanctify the Seventh Day", es:"Cómo Santificar el Séptimo Día", fr:"Comment Sanctifier le Septième Jour", de:"Wie man den siebten Tag heiligt", he:"כֵּיצַד לְקַדֵּשׁ אֶת הַיּוֹם הַשְּׁבִיעִי", ru:"Как святить седьмой день" },
    heb: "אִם תָּשִׁיב מִשַּׁבָּת רַגְלֶךָ",
    hebTrans: "Im tashiv miShabbat raglecha",
    text: {
      pt:"Se no Shabat retiveres o teu pé, de fazeres o que apraz à tua alma no meu dia santo... então te deleitarás no Senhor, e te farei cavalgar sobre as alturas da terra.",
      en:"If you turn back your foot from the Sabbath, from doing your pleasure on My holy day... then you shall delight yourself in the LORD, and I will cause you to ride on the high hills of the earth.",
      es:"Si retrajeres del día de reposo tu pie, de hacer tu voluntad en mi día santo... entonces te deleitarás en el Señor, y te haré subir sobre las alturas de la tierra.",
      fr:"Si tu retiens ton pied pendant le sabbat, pour ne pas faire ta volonté en mon saint jour... alors tu mettras ton plaisir en l'Éternel, et je te ferai monter sur les hauteurs du pays.",
      de:"Wenn du deinen Fuß von der Feier des Sabbats zurückhältst, dass du nicht tust, was dir gefällt an meinem heiligen Tage... dann wirst du Freude haben am HERRN.",
      he:"אִם תָּשִׁיב מִשַּׁבָּת רַגְלֶךָ עֲשׂוֹת חֲפָצֶיךָ בְּיוֹם קָדְשִׁי... אָז תִּתְעַנַּג עַל ה' וְהִרְכַּבְתִּיךָ עַל בָּמֳתֵי אָרֶץ.",
      ru:"Если ты удержишь ногу твою ради субботы от исполнения прихотей твоих в святый день Мой... то будешь иметь радость в Господе.",
    },
    ref: "Isaías 58:13-14",
    icon: "🌿",
    color: "#FB923C",
  },
];

const SHABAT_PRACTICES = [
  {
    icon: "🕯️",
    title: { pt:"Acender as velas", en:"Lighting the Candles", es:"Encender las Velas", fr:"Allumer les Bougies", de:"Kerzen anzünden", he:"הַדְלָקַת נֵרוֹת", ru:"Зажигание свечей" },
    desc: {
      pt:"Ao pôr do sol da sexta-feira, duas velas são acesas marcando a entrada do Shabat. A mulher cobre os olhos e recita a bênção: Baruch Atah Adonai, Eloheinu Melech haolam, asher kidshanu bemitzvotav vetzivanu lehadlik ner shel Shabat.",
      en:"At sunset on Friday, two candles are lit marking the entrance of Shabbat. The woman covers her eyes and recites the blessing: Baruch Atah Adonai, Eloheinu Melech haolam, asher kidshanu bemitzvotav vetzivanu lehadlik ner shel Shabat.",
      es:"Al atardecer del viernes, se encienden dos velas marcando la entrada del Shabat. La mujer cubre sus ojos y recita la bendición: Baruch Atah Adonai, Eloheinu Melech haolam, asher kidshanu bemitzvotav vetzivanu lehadlik ner shel Shabat.",
      fr:"Au coucher du soleil vendredi, deux bougies sont allumées marquant l'entrée du Chabbat. La femme se couvre les yeux et récite la bénédiction: Baruch Atah Adonai, Eloheinu Melech haolam.",
      de:"Bei Sonnenuntergang am Freitag werden zwei Kerzen angezündet, die den Beginn des Sabbats markieren. Die Frau bedeckt ihre Augen und spricht den Segen: Baruch Atah Adonai, Eloheinu Melech haolam.",
      he:"עִם שְׁקִיעַת הַחַמָּה בְּיוֹם שִׁישִׁי, מַדְלִיקִים שְׁנֵי נֵרוֹת הַמְּסַמְּנִים אֶת כְּנִיסַת הַשַּׁבָּת.",
      ru:"На закате в пятницу зажигаются две свечи, отмечающие начало Шаббата. Женщина закрывает глаза и произносит благословение.",
    },
  },
  {
    icon: "🍷",
    title: { pt:"Kidush — Santificação", en:"Kiddush — Sanctification", es:"Kidush — Santificación", fr:"Kiddouch — Sanctification", de:"Kiddusch — Heiligung", he:"קִדּוּשׁ", ru:"Кидуш — освящение" },
    desc: {
      pt:"Sobre uma taça de vinho (ou suco de uva), recita-se a oração de santificação do Shabat, lembrando tanto a criação quanto a saída do Egito.",
      en:"Over a cup of wine (or grape juice), the prayer sanctifying Shabbat is recited, recalling both creation and the exodus from Egypt.",
      es:"Sobre una copa de vino (o jugo de uva), se recita la oración de santificación del Shabat, recordando tanto la creación como la salida de Egipto.",
      fr:"Sur une coupe de vin (ou de jus de raisin), on récite la prière de sanctification du Chabbat, rappelant à la fois la création et la sortie d'Égypte.",
      de:"Über einem Becher Wein (oder Traubensaft) wird das Gebet zur Heiligung des Sabbats gesprochen, das sowohl an die Schöpfung als auch an den Auszug aus Ägypten erinnert.",
      he:"עַל כּוֹס יַיִן מְבָרְכִים אֶת קִדּוּשׁ הַשַּׁבָּת, לְזֵכֶר מַעֲשֵׂה בְרֵאשִׁית וִיצִיאַת מִצְרַיִם.",
      ru:"Над бокалом вина (или виноградного сока) произносится молитва освящения Шаббата, вспоминая как творение, так и исход из Египта.",
    },
  },
  {
    icon: "🍞",
    title: { pt:"Chalá — Pão do Sábado", en:"Challah — Sabbath Bread", es:"Jalá — Pan del Sábado", fr:"Hallah — Pain du Chabbat", de:"Challa — Sabbatbrot", he:"חַלָּה", ru:"Хала — субботний хлеб" },
    desc: {
      pt:"Dois pães trançados (chalot) são cobertos com um pano durante o Kidush em memória do maná duplo que Deus proveu às sextas-feiras no deserto.",
      en:"Two braided loaves (challot) are covered with a cloth during Kiddush, in memory of the double portion of manna God provided on Fridays in the desert.",
      es:"Dos panes trenzados (jalot) se cubren con un paño durante el Kidush, en memoria del maná doble que Dios proveyó los viernes en el desierto.",
      fr:"Deux pains tressés (hallot) sont couverts d'un tissu pendant le Kiddouch, en mémoire de la double portion de manne que Dieu a fournie le vendredi dans le désert.",
      de:"Zwei geflochtene Brote (Challot) werden während des Kiddusch mit einem Tuch bedeckt, zur Erinnerung an die doppelte Portion Manna, die Gott freitags in der Wüste gab.",
      he:"שְׁתֵּי חַלּוֹת מְכֻסּוֹת בְּמַפָּה בְּעֵת הַקִּדּוּשׁ, לְזֵכֶר לֶחֶם הַמִּשְׁנֶה שֶׁל הַמָּן בְּעֶרֶב שַׁבָּת בַּמִּדְבָּר.",
      ru:"Два плетёных хлеба (халы) накрываются тканью во время Кидуша в память о двойной порции манны, которую Бог давал по пятницам в пустыне.",
    },
  },
  {
    icon: "📖",
    title: { pt:"Estudo e Torá", en:"Study and Torah", es:"Estudio y Torá", fr:"Étude et Torah", de:"Studium und Tora", he:"לִמּוּד וְתוֹרָה", ru:"Изучение и Тора" },
    desc: {
      pt:"O Shabat é consagrado ao estudo das Escrituras, à leitura da Parashat HaShavua e à meditação na Palavra — o maior prazer espiritual do dia.",
      en:"Shabbat is devoted to the study of Scripture, reading the Parashat HaShavua, and meditation on the Word — the greatest spiritual pleasure of the day.",
      es:"El Shabat está consagrado al estudio de las Escrituras, a la lectura de la Parashat HaShavua y a la meditación en la Palabra — el mayor placer espiritual del día.",
      fr:"Le Chabbat est consacré à l'étude des Écritures, à la lecture de la Parashat HaShavua et à la méditation de la Parole — le plus grand plaisir spirituel du jour.",
      de:"Der Sabbat ist dem Studium der Schrift, dem Lesen der Parashat HaShavua und der Meditation über das Wort gewidmet — die größte geistliche Freude des Tages.",
      he:"הַשַּׁבָּת מֻקְדֶּשֶׁת לְלִמּוּד הַכְּתוּבִים, לִקְרִיאַת הַפָּרָשָׁה וּלְהִרְהוּר בַּדָּבָר — הָעֹנֶג הָרוּחָנִי הַגָּדוֹל בְּיוֹתֵר שֶׁל הַיּוֹם.",
      ru:"Шаббат посвящён изучению Писания, чтению недельной главы Торы и размышлению над Словом — величайшему духовному удовольствию дня.",
    },
  },
  {
    icon: "🤝",
    title: { pt:"Família e Comunidade", en:"Family and Community", es:"Familia y Comunidad", fr:"Famille et Communauté", de:"Familie und Gemeinschaft", he:"מִשְׁפָּחָה וְקְהִלָּה", ru:"Семья и община" },
    desc: {
      pt:"Reunir família e amigos à mesa, cantar Zmirót (hinos do Shabat), orar juntos e descansar do trabalho cotidiano é parte essencial da santificação.",
      en:"Gathering family and friends at the table, singing Zemirot (Shabbat hymns), praying together, and resting from daily work is an essential part of sanctification.",
      es:"Reunir a la familia y amigos en la mesa, cantar Zemirot (himnos del Shabat), orar juntos y descansar del trabajo cotidiano es parte esencial de la santificación.",
      fr:"Réunir famille et amis à table, chanter des Zemirot (hymnes du Chabbat), prier ensemble et se reposer du travail quotidien fait partie essentielle de la sanctification.",
      de:"Familie und Freunde am Tisch zu versammeln, Zemirot (Sabbatlieder) zu singen, gemeinsam zu beten und von der täglichen Arbeit zu ruhen, ist wesentlicher Teil der Heiligung.",
      he:"אִסּוּף מִשְׁפָּחָה וַחֲבֵרִים לַשֻּׁלְחָן, שִׁירַת זְמִירוֹת, תְּפִלָּה מְשֻׁתֶּפֶת וּמְנוּחָה מֵעֲבוֹדַת יוֹם יוֹם הֵם חֵלֶק חִיּוּנִי מֵהַקִּדּוּשׁ.",
      ru:"Собрать семью и друзей за столом, петь Земирот (субботние гимны), молиться вместе и отдыхать от повседневной работы — существенная часть освящения.",
    },
  },
  {
    icon: "✨",
    title: { pt:"Havdalah — Separação", en:"Havdalah — Separation", es:"Havdalá — Separación", fr:"Havdalah — Séparation", de:"Hawdalah — Trennung", he:"הַבְדָּלָה", ru:"Гавдала — разделение" },
    desc: {
      pt:"Ao aparecerem três estrelas no sábado à noite, encerra-se o Shabat com o ritual de Havdalah: vinho, especiarias aromáticas e uma vela trançada, separando o sagrado do profano.",
      en:"When three stars appear on Saturday night, Shabbat is concluded with the Havdalah ritual: wine, fragrant spices, and a braided candle, separating the sacred from the profane.",
      es:"Cuando aparecen tres estrellas el sábado por la noche, se concluye el Shabat con el ritual de Havdalá: vino, especias aromáticas y una vela trenzada, separando lo sagrado de lo profano.",
      fr:"Quand trois étoiles apparaissent samedi soir, le Chabbat se termine par le rituel de la Havdalah: vin, épices parfumées et une bougie tressée, séparant le sacré du profane.",
      de:"Wenn am Samstagabend drei Sterne erscheinen, wird der Sabbat mit dem Hawdalah-Ritual beendet: Wein, duftende Gewürze und eine geflochtene Kerze, die das Heilige vom Profanen trennt.",
      he:"עִם הוֹפָעַת שְׁלוֹשָׁה כּוֹכָבִים בְּמוֹצָאֵי שַׁבָּת, מְסַיְּמִים אֶת הַשַּׁבָּת בְּטֶקֶס הַבְדָּלָה: יַיִן, בְּשָׂמִים וְנֵר הַבְדָּלָה.",
      ru:"Когда в субботу вечером появляются три звезды, Шаббат завершается ритуалом Гавдалы: вино, ароматные специи и плетёная свеча, отделяющие святое от будничного.",
    },
  },
];

function ShabatPage({ lang = "pt" }) {
  const t = useT(lang);
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = ((5 - dayOfWeek + 7) % 7) || 7;
  const isShabatNow = dayOfWeek === 6;
  const isFridayNow = dayOfWeek === 5;

  const [expanded,  setExpanded]  = useState(null);
  const [countdown, setCountdown] = useState("");
  const [times,     setTimes]     = useState(null);
  const [city,      setCity]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [locError,  setLocError]  = useState("");
  const [showLoc,   setShowLoc]   = useState(false);

  const CITIES = [
    { name:"São Paulo, BR",      lat:-23.55,  lng:-46.63 },
    { name:"Rio de Janeiro, BR", lat:-22.9,   lng:-43.17 },
    { name:"Brasília, BR",       lat:-15.78,  lng:-47.93 },
    { name:"Salvador, BR",       lat:-12.97,  lng:-38.50 },
    { name:"Recife, BR",         lat:-8.05,   lng:-34.88 },
    { name:"Porto Alegre, BR",   lat:-30.03,  lng:-51.23 },
    { name:"Curitiba, BR",       lat:-25.43,  lng:-49.27 },
    { name:"Manaus, BR",         lat:-3.10,   lng:-60.02 },
    { name:"Fortaleza, BR",      lat:-3.72,   lng:-38.54 },
    { name:"Jerusalem, IL",      lat:31.78,   lng:35.22  },
    { name:"Tel Aviv, IL",       lat:32.08,   lng:34.78  },
    { name:"Lisboa, PT",         lat:38.72,   lng:-9.14  },
    { name:"Madrid, ES",         lat:40.42,   lng:-3.70  },
    { name:"Paris, FR",          lat:48.85,   lng:2.35   },
    { name:"Berlin, DE",         lat:52.52,   lng:13.40  },
    { name:"London, UK",         lat:51.51,   lng:-0.13  },
    { name:"New York, US",       lat:40.71,   lng:-74.00 },
    { name:"Miami, US",          lat:25.77,   lng:-80.19 },
    { name:"Buenos Aires, AR",   lat:-34.60,  lng:-58.38 },
    { name:"Moscow, RU",         lat:55.75,   lng:37.62  },
  ];

  // Contagem regressiva em tempo real
  useEffect(() => {
    function calc() {
      const n = new Date();
      const d = n.getDay();
      // Usar horário real de velas se disponível, senão 18h
      let candleHour = 18, candleMin = 0;
      if (times) {
        const [ch, cm] = times.candles.split(":").map(Number);
        candleHour = ch; candleMin = cm;
      }
      const target = new Date(n);
      const dToFri = ((5 - d + 7) % 7);
      if (dToFri === 0 && (n.getHours() > candleHour || (n.getHours() === candleHour && n.getMinutes() >= candleMin))) {
        target.setDate(n.getDate() + 7);
      } else {
        target.setDate(n.getDate() + dToFri);
      }
      target.setHours(candleHour, candleMin, 0, 0);
      if (d === 6 && n.getHours() < 20) { setCountdown("✡"); return; }
      const diff = target - n;
      if (diff <= 0) { setCountdown("✡"); return; }
      const totalSec = Math.floor(diff / 1000);
      const days2 = Math.floor(totalSec / 86400);
      const hrs  = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      if (days2 > 0) setCountdown(`${days2}d ${String(hrs).padStart(2,"0")}h ${String(mins).padStart(2,"0")}m`);
      else setCountdown(`${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [times]);

  const todayHeb = useMemo(() => getTodayHebrew(), []);

  function calcFromCoords(lat, lng, label) {
    const tt = getShabatTimes(lat, lng);
    setTimes({ ...tt, city: label });
    setLocError("");
    setCity(label);
  }

  function handleGeo() {
    setLoading(true); setLocError("");
    if (!navigator.geolocation) { setLocError(t("locationError")); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { calcFromCoords(pos.coords.latitude, pos.coords.longitude, t("useMyLocation")); setLoading(false); },
      () => { setLocError(t("locationError")); setLoading(false); }
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 100px" }}>
      <SectionTitle sub={t("shabatSectionSub")}>
        🕯️ {t("nav_shabat")} — שַׁבָּת
      </SectionTitle>

      {/* ── HERO: Contagem Regressiva ── */}
      <div className="fade-up" style={{
        background: isShabatNow
          ? `linear-gradient(145deg, rgba(212,175,55,0.18), ${inkMid(0.6)})`
          : `linear-gradient(145deg, ${inkMid(0.9)}, ${inkMid(0.8)})`,
        border: `1.5px solid ${isShabatNow ? S.gold : S.goldBorder}`,
        borderRadius: 20, padding: "28px 24px", marginBottom: 16,
        textAlign: "center", position: "relative", overflow: "hidden",
        boxShadow: isShabatNow ? `0 0 40px ${S.gold}33` : "none",
      }}>
        {/* estrelas decorativas */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            top: `${Math.abs(Math.sin(i * 47.3)) * 90}%`,
            left: `${Math.abs(Math.cos(i * 47.3)) * 95}%`,
            width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2,
            borderRadius: "50%", background: "white", opacity: 0.15 + (i % 5) * 0.07,
          }} />
        ))}

        <div style={{ position: "relative" }}>
          {/* Ícone das velas */}
          <div style={{ fontSize: 52, marginBottom: 10,
            filter: `drop-shadow(0 0 12px ${S.gold}88)` }}>
            🕯️
          </div>

          {isShabatNow ? (
            <>
              <div className="cinzel" style={{ color: S.goldLight, fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                {t("shabatShalom")}
              </div>
              <div className="hebrew" style={{ color: S.gold, fontSize: 28, marginBottom: 10 }}>
                שַׁבָּת שָׁלוֹם
              </div>
              <div style={{ color: S.textSub, fontSize: 13 }}>
                {t("shabatHappening")}
              </div>
            </>
          ) : (
            <>
              <div style={{ color: S.textMuted, fontSize: 12, marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {isFridayNow ? t("shabatTonight") : t("nextShabat")}
              </div>
              <div className="cinzel" style={{
                fontSize: daysUntilFriday <= 1 ? 42 : 36,
                fontWeight: 900, color: S.goldLight,
                lineHeight: 1, marginBottom: 8,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: daysUntilFriday <= 1 ? "0.04em" : "0.02em",
              }}>
                {countdown || "..."}
              </div>
              <div style={{ color: S.textMuted, fontSize: 12 }}>
                {daysUntilFriday <= 1
                  ? t("tonightAtSunset")
                  : `${daysUntilFriday} ${daysUntilFriday === 1 ? t("dayWord") : t("daysWord")} ${t("untilShabatStart")}`}
              </div>
            </>
          )}

          {/* Data hebraica atual */}
          <div style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.05)", borderRadius: 20,
            padding: "6px 16px", border: `1px solid ${S.goldBorder}`,
          }}>
            <span style={{ color: S.textMuted, fontSize: 11 }}>{t("todayLabel2")}</span>
            <span style={{ color: S.text, fontSize: 12, fontWeight: 600 }}>
              {todayHeb.day} de {todayHeb.monthName}
            </span>
            <span className="hebrew" style={{ color: S.gold, fontSize: 15 }}>
              {todayHeb.monthNameHeb}
            </span>
          </div>
        </div>
      </div>

      {/* ── BLOCO DE LOCALIZAÇÃO ── */}
      <div style={{ marginBottom: 14 }}>
        {/* Toggle mostrar/esconder localização */}
        <button
          onClick={() => setShowLoc(v => !v)}
          style={{
            width: "100%", background: times ? S.goldBg : S.bgCard,
            border: `1px solid ${times ? S.gold : S.goldBorder}`,
            borderRadius: 14, padding: "12px 18px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📍</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: times ? S.goldLight : S.text, fontWeight: 700, fontSize: 13 }}>
                {times ? times.city : t("useMyLocation")}
              </div>
              <div style={{ color: S.textMuted, fontSize: 11 }}>
                {times
                  ? `🕯️ ${t("candleLighting")}: ${times.candles}  ✨ ${t("havdalah")}: ${times.havdalah}`
                  : t("calcLocalTimes")}
              </div>
            </div>
          </div>
          <span style={{
            color: S.gold, fontSize: 18, transition: "transform 0.25s",
            transform: showLoc ? "rotate(180deg)" : "rotate(0deg)",
          }}>⌄</span>
        </button>

        {/* Painel de localização expansível */}
        {showLoc && (
          <div className="fade-up" style={{
            background: S.bgCard, border: `1px solid ${S.goldBorder}`,
            borderRadius: "0 0 14px 14px", borderTop: "none",
            padding: "16px 16px 18px",
          }}>
            {/* Botão GPS */}
            <button onClick={handleGeo} disabled={loading} style={{
              width: "100%", marginBottom: 14,
              background: `linear-gradient(135deg, ${S.gold}, ${S.goldLight})`,
              border: "none", borderRadius: 10, color: "#0A1B45",
              fontWeight: 700, fontSize: 13, padding: "11px 0",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <span>📍</span>
              {loading ? t("locating") : t("useMyLocation")}
            </button>
            {locError && <div style={{ color: S.danger, fontSize: 11, marginBottom: 10, textAlign: "center" }}>{locError}</div>}

            {/* Lista de cidades */}
            <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 8 }}>{t("orSelectCity")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CITIES.map(c => (
                <button key={c.name} onClick={() => { calcFromCoords(c.lat, c.lng, c.name); setShowLoc(false); }} style={{
                  background: city === c.name ? S.goldBg : "rgba(255,255,255,0.04)",
                  border: `1px solid ${city === c.name ? S.gold : S.goldBorder}`,
                  color: city === c.name ? S.goldLight : S.textMuted,
                  borderRadius: 20, padding: "5px 12px", fontSize: 11,
                  cursor: "pointer", transition: "all 0.15s",
                }}>{c.name}</button>
              ))}
            </div>
          </div>
        )}

        {/* Horários detalhados quando localização ativa */}
        {times && (
          <div className="fade-up" style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 8, marginTop: 10,
          }}>
            {[
              { label: t("candleLighting"), value: times.candles,   sub: `18 ${t("minBeforeSunset")}`, color: "#fbbf24" },
              { label: t("sunset"),         value: times.sunsetFri, sub: "Sexta-feira / Friday",        color: S.gold    },
              { label: t("sunrise"),        value: times.sunriseSat,sub: "Sábado / Saturday",           color: "#60a5fa" },
              { label: t("havdalah"),       value: times.havdalah,  sub: `3 ${t("starsVisible")}`,      color: "#a78bfa" },
            ].map(item => (
              <div key={item.label} style={{
                background: `${item.color}0d`, border: `1px solid ${item.color}33`,
                borderRadius: 12, padding: "12px 14px", textAlign: "center",
              }}>
                <div style={{ color: S.textMuted, fontSize: 10, marginBottom: 4 }}>{item.label}</div>
                <div className="cinzel" style={{ fontSize: 26, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</div>
                <div style={{ color: S.textMuted, fontSize: 9, marginTop: 4 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Versículo central ── */}
      <div className="fade-up" style={{
        background: S.goldBg, border: `1px solid ${S.goldBorder}`,
        borderRadius: 16, padding: "18px 22px", marginBottom: 16,
        textAlign: "center",
      }}>
        <div className="hebrew" style={{ color: S.goldLight, fontSize: 20, lineHeight: 1.8, marginBottom: 8 }}>
          זָכוֹר אֶת יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ
        </div>
        <div style={{ color: S.text, fontSize: 14, fontStyle: "italic", lineHeight: 1.7, marginBottom: 6 }}>
          "{t("rememberShabatVerse")}"
        </div>
        <div style={{ color: S.gold, fontSize: 12 }}>Êxodo 20:8 — {t("fourthCommandment")}</div>
      </div>

      {/* ── Ensinamentos expandíveis ── */}
      <div style={{ marginBottom: 16 }}>
        <div className="cinzel" style={{
          color: S.goldLight, fontSize: 14, fontWeight: 700,
          letterSpacing: "0.05em", marginBottom: 12, textAlign: "center",
        }}>
          {t("whatScriptureSays")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SHABAT_TEACHINGS.map((teaching, i) => {
            const isOpen = expanded === i;
            const teachTitle = teaching.title[lang] || teaching.title.pt;
            const teachText  = teaching.text[lang]  || teaching.text.pt;
            return (
              <div key={i} style={{
                background: isOpen ? `${teaching.color}0e` : S.bgCard,
                border: `1.5px solid ${isOpen ? teaching.color + "44" : S.goldBorder}`,
                borderRadius: 16, overflow: "hidden",
                transition: "all 0.25s ease",
              }}>
                {/* Cabeçalho clicável */}
                <div
                  onClick={() => setExpanded(isOpen ? null : i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${teaching.color}18`, border: `1.5px solid ${teaching.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                  }}>{teaching.icon}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ color: isOpen ? teaching.color : S.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                      {teachTitle}
                    </div>
                    <div className="hebrew" style={{ color: `${teaching.color}99`, fontSize: 13 }}>
                      {teaching.heb}
                    </div>
                  </div>

                  <div style={{
                    color: isOpen ? teaching.color : S.textMuted,
                    fontSize: 18, lineHeight: 1, transition: "transform 0.25s",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}>⌄</div>
                </div>

                {/* Conteúdo expandido */}
                {isOpen && (
                  <div className="fade-up" style={{
                    padding: "0 16px 16px",
                    borderTop: `1px solid ${teaching.color}22`,
                  }}>
                    <div style={{
                      background: ink(0.35), borderRadius: 10,
                      padding: "10px 14px", marginBottom: 10, marginTop: 10,
                    }}>
                      <div className="hebrew" style={{
                        color: teaching.color, fontSize: 16, lineHeight: 1.8,
                        marginBottom: 6, textAlign: "right",
                      }}>{teaching.heb}</div>
                      <div style={{ color: S.textMuted, fontSize: 11, textAlign: "center", fontStyle: "italic" }}>
                        {teaching.hebTrans}
                      </div>
                    </div>
                    <p style={{ color: S.textSub, fontSize: 13, lineHeight: 1.75, marginBottom: 8 }}>
                      {teachText}
                    </p>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      color: teaching.color, fontSize: 12, fontStyle: "italic",
                    }}>
                      <span>📖</span> {teaching.ref}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Como Praticar ── */}
      <div style={{ marginBottom: 16 }}>
        <div className="cinzel" style={{
          color: S.goldLight, fontSize: 14, fontWeight: 700,
          letterSpacing: "0.05em", marginBottom: 12, textAlign: "center",
        }}>
          {t("howToSanctify")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {SHABAT_PRACTICES.map((practice, i) => (
            <div key={i} style={{
              background: S.bgCard, border: `1px solid ${S.goldBorder}`,
              borderRadius: 16, padding: "14px 16px",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = S.bgCardHover}
              onMouseLeave={e => e.currentTarget.style.background = S.bgCard}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: S.goldBg, border: `1px solid ${S.goldBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>{practice.icon}</div>
                <div style={{ color: S.text, fontWeight: 700, fontSize: 13 }}>{practice.title[lang] || practice.title.pt}</div>
              </div>
              <p style={{ color: S.textMuted, fontSize: 12, lineHeight: 1.65 }}>{practice.desc[lang] || practice.desc.pt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bênção do Shabat ── */}
      <div style={{
        background: `linear-gradient(135deg, ${inkMid(0.8)}, ${inkMid(0.6)})`,
        border: `1px solid ${S.goldBorder}`, borderRadius: 20,
        padding: "24px", textAlign: "center",
      }}>
        <div style={{ color: S.textMuted, fontSize: 11, letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>
          {t("priestlyBlessing")}
        </div>
        <div className="hebrew" style={{ color: S.goldLight, fontSize: 20, lineHeight: 2, marginBottom: 8 }}>
          יְבָרֶכְךָ יְהוָה וְיִשְׁמְרֶךָ
          <br />
          יָאֵר יְהוָה פָּנָיו אֵלֶיךָ וִיחֻנֶּךָּ
          <br />
          יִשָּׂא יְהוָה פָּנָיו אֵלֶיךָ וְיָשֵׂם לְךָ שָׁלוֹם
        </div>
        <div style={{ color: S.textSub, fontSize: 12, lineHeight: 1.8, fontStyle: "italic" }}>
          "{t("priestlyBlessingText")}"
        </div>
        <div style={{ color: S.gold, fontSize: 11, marginTop: 8 }}>Números 6:24-26</div>
        <div style={{ marginTop: 14 }}>
          <span className="cinzel hebrew" style={{ color: S.gold, fontSize: 18 }}>שַׁבָּת שָׁלוֹם</span>
          <span style={{ color: S.textMuted, fontSize: 13, marginLeft: 8 }}>— {t("shabatShalom")}</span>
        </div>
      </div>
    </div>
  );
}

// ─── FEASTS PAGE ──────────────────────────────────────────────────────────────

function FeastsPage({ lang = "pt" }) {
  const t = useT(lang);
  const localeMap = { pt:"pt-BR", en:"en-US", es:"es-ES", fr:"fr-FR", de:"de-DE", he:"he-IL", ru:"ru-RU" };
  const [selected, setSelected] = useState(null);
  const upcoming = useMemo(() => getUpcomingFeasts(365), []);
  const spring = BIBLICAL_FEASTS.filter(f => f.cat === "spring");
  const fall = BIBLICAL_FEASTS.filter(f => f.cat === "fall");
  const other = BIBLICAL_FEASTS.filter(f => f.cat === "other");
  const [tab, setTab] = useState("upcoming");

  const catColor = { spring: "#4ade80", fall: "#fb923c", other: "#a78bfa" };
  const catBg = { spring: S.spring, fall: S.fall, other: S.other };

  const FeastCard = ({ feast, upcomingInfo }) => {
    const isSel = selected?.name === feast.name;
    return (
      <div onClick={() => setSelected(isSel ? null : feast)} style={{
        background: isSel ? S.goldBg : S.bgCard,
        border: `1px solid ${isSel ? S.gold : S.goldBorder}`,
        borderRadius: 14, padding: 16, cursor: "pointer", transition: "all 0.2s",
        marginBottom: 10,
      }}
        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = S.bgCardHover; }}
        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = S.bgCard; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20 }}>{feast.emoji}</span>
              <span style={{ color: S.text, fontWeight: 700, fontSize: 15 }}>{feast.name}</span>
              <span style={{ background: `${catColor[feast.cat]}22`, color: catColor[feast.cat], fontSize: 10, padding: "2px 8px", borderRadius: 20, border: `1px solid ${catColor[feast.cat]}44` }}>
                {feast.cat === "spring" ? t("categorySpring") : feast.cat === "fall" ? t("categoryFall") : t("categoryOther")}
              </span>
              {upcomingInfo && <Badge color={S.goldLight}>{upcomingInfo.daysAway === 0 ? t("todayBang") : upcomingInfo.daysAway === 1 ? t("tomorrowBang") : `${upcomingInfo.daysAway} ${t("daysWord")}`}</Badge>}
            </div>
            <div className="hebrew" style={{ color: S.gold, fontSize: 20 }}>{feast.heb}</div>
            <div style={{ color: S.textMuted, fontSize: 12, marginTop: 2 }}>{feast.date} • {feast.dur} {feast.dur === 1 ? t("dayWord") : t("daysWord")}</div>
          </div>
          <span style={{ color: S.textMuted, fontSize: 18, marginLeft: 8 }}>{isSel ? "▲" : "▼"}</span>
        </div>

        {isSel && (
          <div className="fade-up" style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${S.goldBorder}` }}>
            <p style={{ color: S.text, fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>{feast.desc[lang] || feast.desc.pt}</p>
            <div style={{ background: S.goldBg, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ color: S.goldLight, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{t("messianicMeaning")}</div>
              <p style={{ color: S.text, fontSize: 13, lineHeight: 1.6 }}>{feast.sig[lang] || feast.sig.pt}</p>
            </div>
            <div style={{ color: S.gold, fontSize: 12, fontStyle: "italic" }}>📖 {feast.scripture}</div>
          </div>
        )}
      </div>
    );
  };

  const upcomingMap = {};
  upcoming.forEach(u => { upcomingMap[u.feast.name] = u; });

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      flex: 1, background: tab === id ? S.goldBg : "transparent",
      border: "none", color: tab === id ? S.goldLight : S.textMuted,
      borderRadius: 8, padding: "8px 4px", fontSize: 13, fontWeight: 500, cursor: "pointer",
    }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 100px" }}>
      <SectionTitle sub={t("feastsHeaderSub")}>{t("nav_feasts")}</SectionTitle>

      {/* Upcoming alerts */}
      {upcoming.length > 0 && (
        <div className="fade-up" style={{ background: S.goldBg, border: `1px solid ${S.goldBorder}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{t("upcomingFeastsBox")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map(({ feast, date, daysAway }) => (
              <div key={feast.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: ink(0.4), borderRadius: 10 }}>
                <span style={{ fontSize: 22 }}>{feast.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: S.text, fontWeight: 600, fontSize: 13 }}>{feast.name}</div>
                  <div style={{ color: S.textMuted, fontSize: 11 }}>{date.toLocaleDateString(localeMap[lang] || "pt-BR", { day: "2-digit", month: "long" })}</div>
                </div>
                <Badge color={daysAway === 0 ? "#4ade80" : daysAway <= 7 ? S.goldLight : S.gold}>
                  {daysAway === 0 ? t("todayBang") : daysAway === 1 ? t("tomorrowBang").replace("!","") : `${daysAway} ${t("daysWord")}`}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", background: S.bgCard, border: `1px solid ${S.goldBorder}`, borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
        <TabBtn id="upcoming" label={t("tabSpring")} />
        <TabBtn id="fall" label={t("tabFall")} />
        <TabBtn id="other" label={t("tabOther")} />
      </div>

      {tab === "upcoming" && spring.map(f => <FeastCard key={f.name} feast={f} upcomingInfo={upcomingMap[f.name]} />)}
      {tab === "fall" && fall.map(f => <FeastCard key={f.name} feast={f} upcomingInfo={upcomingMap[f.name]} />)}
      {tab === "other" && other.map(f => <FeastCard key={f.name} feast={f} upcomingInfo={upcomingMap[f.name]} />)}
    </div>
  );
}

// ─── LEARN PAGE ───────────────────────────────────────────────────────────────

// Renderiza texto com marcadores __palavra__ como <strong> colorido
function renderBold(text, color) {
  if (!text) return null;
  const parts = text.split(/__(.+?)__/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: color || "inherit" }}>{part}</strong>
      : <span key={i}>{part}</span>
  );
}

function LearnPage({ lang = "pt" }) {
  const t = useT(lang);
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 100px" }}>
      <SectionTitle sub={t("learnSub")}>{t("learnTitle")}</SectionTitle>

      <Card style={{ marginBottom: 24, background: inkMid(0.4) }}>
        <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{t("lunisolarTitle")}</div>
        <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.7 }}>
          {renderBold(T.lunisolarText[lang] || T.lunisolarText.pt, S.gold)}
        </p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {HEBREW_MONTHS.map(m => {
          const feasts = BIBLICAL_FEASTS.filter(f => f.month === m.id);
          const isExp = expanded === m.id;
          return (
            <div key={m.id} onClick={() => setExpanded(isExp ? null : m.id)} style={{
              background: isExp ? S.goldBg : S.bgCard,
              border: `1px solid ${isExp ? S.gold : S.goldBorder}`,
              borderRadius: 14, padding: 16, cursor: "pointer", transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ background: S.goldBg, color: S.gold, fontSize: 10, padding: "2px 8px", borderRadius: 20, border: `1px solid ${S.goldBorder}` }}>{m.id}º {t("month")}</span>
                    <span style={{ color: S.textMuted, fontSize: 11 }}>{m.approx}</span>
                  </div>
                  <div style={{ color: S.text, fontWeight: 700, fontSize: 16 }}>{m.name}</div>
                  <div className="hebrew" style={{ color: S.gold, fontSize: 22 }}>{m.heb}</div>
                  <div style={{ color: S.textMuted, fontSize: 12, fontStyle: "italic" }}>"{m.desc[lang] || m.desc.pt}"</div>
                </div>
                <span style={{ color: S.textMuted, fontSize: 16 }}>{isExp ? "▲" : "▼"}</span>
              </div>

              {feasts.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {feasts.map(f => (
                    <span key={f.name} style={{ background: S.goldBg, color: S.gold, fontSize: 10, padding: "2px 8px", borderRadius: 20, border: `1px solid ${S.goldBorder}` }}>
                      {f.emoji} {f.name.split("(")[0].trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Card style={{ marginTop: 24, background: inkMid(0.4) }}>
        <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{t("messianicConnTitle")}</div>
        <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.7 }}>
          {renderBold(T.messianicConnText[lang] || T.messianicConnText.pt, "#4ade80")}
        </p>
      </Card>
    </div>
  );
}

// ─── PWA INSTALL BANNER ───────────────────────────────────────────────────────

function InstallBanner({ lang = "pt" }) {
  const t = useT(lang);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShow(true); };
    const installedHandler = () => { setDeferredPrompt(null); setShow(false); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (!show) return null;

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
  };

  return (
    <div style={{
      position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 200,
      background: `linear-gradient(135deg, ${inkMid(0.98)}, ${ink(0.98)})`,
      border: `1px solid ${S.gold}`, borderRadius: 16, padding: 16,
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: `0 8px 32px rgba(212,168,67,0.2)`,
    }}>
      <MenorahLogo size={40} glow={false} />
      <div style={{ flex: 1 }}>
        <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 13 }}>{t("installApp")}</div>
        <div style={{ color: S.textMuted, fontSize: 11 }}>{t("offlineAccess")}</div>
      </div>
      <button aria-label={t("installApp")} onClick={install} style={{ background: S.gold, border: "none", color: S.bg, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t("installBtn")}</button>
      <button aria-label={t("close")} onClick={() => setShow(false)} style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", fontSize: 18 }}>×</button>
    </div>
  );
}

// ─── PWA INSTALL BUTTON (for in-page placement) ─────────────────────────────────

function InstallButton({ lang = "pt", style = {} }) {
  const t = useT(lang);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    const installedHandler = () => {
      setDeferredPrompt(null);
      setShowHint(false);
      setIsInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (isInstalled || typeof window === "undefined") return null;

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
      return;
    }
    setShowHint(true);
  };

  const hintText = isIos
    ? t("installIosHint")
    : t("installDesktopHint") || "Use Chrome, Edge ou Samsung Internet para instalar";

  return (
    <div style={{ position: "relative", ...style }}>
      <button aria-label={t("addToHomeScreen")} onClick={handleClick} style={{
        background: `linear-gradient(135deg, ${S.gold} 0%, ${S.goldLight} 100%)`,
        color: "#0A1B45", border: "none", borderRadius: 12,
        padding: "10px 16px", fontSize: 12, fontWeight: 700,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
        boxShadow: `0 4px 18px ${S.goldGlow}`,
        fontFamily: "'Inter', sans-serif", letterSpacing: "0.02em",
        transition: "all 0.2s ease",
      }}>
        <MenorahLogo size={22} glow={false} />
        {t("addToHomeScreen")}
      </button>
      {showHint && (
        <div role="dialog" aria-modal="true" aria-label={t("installApp")} onClick={() => setShowHint(false)} style={{
          position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.62)",
          display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16,
        }}>
          <div className="fade-up" onClick={(event) => event.stopPropagation()} style={{
            width: "100%", maxWidth: 420, background: S.navBg, backdropFilter: "blur(16px)",
            border: `1px solid ${S.goldBorder}`, borderRadius: 16, padding: 20,
            color: S.textSub, boxShadow: "0 16px 48px rgba(0,0,0,0.45)", lineHeight: 1.6,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <strong style={{ color: S.goldLight, fontSize: 16 }}>{t("installApp")}</strong>
              <button aria-label={t("close")} onClick={() => setShowHint(false)} style={{ border: "none", background: "transparent", color: S.textMuted, fontSize: 24, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontSize: 14 }}>
              <span style={{ color: S.gold, fontWeight: 700 }}>{isIos ? "iPhone/iPad: " : "Android: "}</span>
              {hintText}
            </div>
            {isIos && <div style={{ marginTop: 12, fontSize: 13, color: S.textMuted }}>No Safari, toque no ícone de compartilhar □↑ na barra do navegador e escolha “Adicionar à Tela de Início”.</div>}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

function NotificationManager({ lang = "pt" }) {
  const t = useT(lang);
  const [permission, setPermission] = useState("default");
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  // Verifica a permissão atual ao montar (funciona em web e no app nativo)
  useEffect(() => {
    let mounted = true;
    notifGetPermission().then(p => {
      if (!mounted) return;
      setPermission(p);
      setEnabled(p === "granted");
      setChecking(false);
    });
    return () => { mounted = false; };
  }, []);

  const requestPermission = async () => {
    const perm = await notifRequestPermission();
    setPermission(perm);
    if (perm === "granted") {
      setEnabled(true);
      // Notifica sobre festas próximas
      const upcoming = getUpcomingFeasts(7);
      upcoming.forEach(({ feast, daysAway }) => {
        notifShow(
          `${feast.emoji} ${feast.name} ${t("feastApproaching")}`,
          daysAway === 0 ? t("feastTodayNotif") + (feast.desc[lang] || feast.desc.pt) : `${t("inDaysNotif").replace("{n}", daysAway)} ${feast.desc[lang] || feast.desc.pt}`,
          { delayMs: daysAway === 0 ? 0 : 1000, tag: `feast-${feast.name}` }
        );
      });
    }
  };

  if (checking) return null;
  if (permission === "granted" && enabled) return null;

  return (
    <div style={{
      background: S.bgCard, border: `1px solid ${S.goldBorder}`,
      borderRadius: 12, padding: "12px 16px", marginBottom: 16,
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 20 }}>🔔</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: S.text, fontWeight: 600, fontSize: 13 }}>{t("notifFeastsTitle")}</div>
        <div style={{ color: S.textMuted, fontSize: 11 }}>{t("notifFeastsDesc")}</div>
      </div>
      {permission === "denied" ? (
        <span style={{ color: "#f87171", fontSize: 11 }}>{t("blockedInSettings")}</span>
      ) : (
        <button onClick={requestPermission} style={{
          background: S.goldBg, border: `1px solid ${S.goldBorder}`,
          color: S.goldLight, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>{t("activate")}</button>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

// ─── DADOS DAS 12 TRIBOS ─────────────────────────────────────────────────────
// Correspondência: mês hebraico → tribo (Sefer Yetzirah / tradição judaica)
// Fontes: Arizal, Chabad, Sefer Yetzirah
const TRIBES = [
  {
    monthId: 1, monthName: "Nissan",
    tribe: "Yehudá", heb: "יְהוּדָה", eng: "Judah",
    symbol: "🦁", mazal: "Áries ♈", stone: "Rubi",
    stoneHeb: "אֹדֶם", color: "#dc2626",
    blessing: { pt:"Judá é um leãozinho… O cetro não se apartará de Judá. (Gn 49:9-10)", en:"Judah is a lion's whelp… The scepter shall not depart from Judah. (Gen 49:9-10)", es:"Judá es un cachorro de león… El cetro no se apartará de Judá. (Gn 49:9-10)", fr:"Juda est un jeune lion… Le sceptre ne s'éloignera point de Juda. (Gn 49:9-10)", de:"Juda ist ein junger Löwe… Es wird das Zepter von Juda nicht entwendet werden. (1. Mose 49:9-10)", he:"גּוּר אַרְיֵה יְהוּדָה… לֹא יָסוּר שֵׁבֶט מִיהוּדָה. (בְּרֵאשִׁית מט:ט-י)", ru:"Иуда молодой лев… не отойдёт скипетр от Иуды. (Быт 49:9-10)" },
    desc: { pt:"A tribo dos reis e líderes. Yehudá marchava à frente de Israel, sendo a tribo do rei Davi e de Yeshua HaMashiach.", en:"The tribe of kings and leaders. Yehudah marched at the front of Israel, being the tribe of King David and Yeshua HaMashiach.", es:"La tribu de los reyes y líderes. Yehudá marchaba al frente de Israel, siendo la tribu del rey David y de Yeshúa HaMashíaj.", fr:"La tribu des rois et des dirigeants. Yehuda marchait à l'avant d'Israël, étant la tribu du roi David et de Yeshua HaMashiach.", de:"Der Stamm der Könige und Führer. Jehuda marschierte an der Spitze Israels, der Stamm von König David und Jeschua HaMaschiach.", he:"שֵׁבֶט הַמְּלָכִים וְהַמַּנְהִיגִים. יְהוּדָה צָעַד בְּרֹאשׁ יִשְׂרָאֵל, שֵׁבֶט דָּוִד הַמֶּלֶךְ וְיֵשׁוּעַ הַמָּשִׁיחַ.", ru:"Колено царей и вождей. Иуда шёл во главе Израиля, колено царя Давида и Йешуа ха-Машиаха." },
    qualities: {
      pt:["Liderança", "Coragem", "Lealdade", "Realeza"],
      en:["Leadership", "Courage", "Loyalty", "Royalty"],
      es:["Liderazgo", "Coraje", "Lealtad", "Realeza"],
      fr:["Leadership", "Courage", "Loyauté", "Royauté"],
      de:["Führung", "Mut", "Loyalität", "Königtum"],
      he:["מַנְהִיגוּת", "אֹמֶץ", "נֶאֱמָנוּת", "מַלְכוּת"],
      ru:["Лидерство", "Смелость", "Верность", "Царственность"],
    },
    challenge: { pt:"Orgulho e necessidade de controle", en:"Pride and need for control", es:"Orgullo y necesidad de control", fr:"Orgueil et besoin de contrôle", de:"Stolz und Kontrollbedürfnis", he:"גַּאֲוָה וְצֹרֶךְ בִּשְׁלִיטָה", ru:"Гордость и потребность в контроле" },
    scripture: "Gênesis 49:8-12; Números 2:3-9",
  },
  {
    monthId: 2, monthName: "Iyar",
    tribe: "Yissachar", heb: "יִשָּׂשכָר", eng: "Issachar",
    symbol: "🐂", mazal: "Touro ♉", stone: "Topázio",
    stoneHeb: "פִּטְדָה", color: "#d97706",
    blessing: { pt:"Yissachar é um jumento forte, deitado entre as alforjas. (Gn 49:14)", en:"Issachar is a strong donkey, lying down between the sheepfolds. (Gen 49:14)", es:"Isacar es un asno fuerte que se recuesta entre los apriscos. (Gn 49:14)", fr:"Issacar est un âne robuste, couché entre les enclos. (Gn 49:14)", de:"Issachar ist ein knochiger Esel, der zwischen den Hürden liegt. (1. Mose 49:14)", he:"יִשָּׂשכָר חֲמֹר גָּרֶם רֹבֵץ בֵּין הַמִּשְׁפְּתָיִם. (בְּרֵאשִׁית מט:יד)", ru:"Иссахар осёл крепкий, лежащий между протоками вод. (Быт 49:14)" },
    desc: { pt:"A tribo dos sábios e estudiosos da Torá. Especialistas em astronomia e no calendário hebraico, conheciam os tempos e as estações.", en:"The tribe of the wise and Torah scholars. Experts in astronomy and the Hebrew calendar, they knew the times and seasons.", es:"La tribu de los sabios y estudiosos de la Torá. Expertos en astronomía y en el calendario hebreo, conocían los tiempos y las estaciones.", fr:"La tribu des sages et des érudits de la Torah. Experts en astronomie et dans le calendrier hébraïque, ils connaissaient les temps et les saisons.", de:"Der Stamm der Weisen und Toragelehrten. Experten in Astronomie und im hebräischen Kalender, sie kannten die Zeiten und Jahreszeiten.", he:"שֵׁבֶט הַחֲכָמִים וְלוֹמְדֵי הַתּוֹרָה. מֻמְחִים בְּאַסְטְרוֹנוֹמְיָה וּבַלּוּחַ הָעִבְרִי, יָדְעוּ אֶת הָעִתִּים וְהַזְּמַנִּים.", ru:"Колено мудрецов и знатоков Торы. Эксперты в астрономии и еврейском календаре, они знали времена и сроки." },
    qualities: {
      pt:["Sabedoria", "Dedicação ao estudo", "Discernimento dos tempos", "Paciência"],
      en:["Wisdom", "Dedication to study", "Discernment of times", "Patience"],
      es:["Sabiduría", "Dedicación al estudio", "Discernimiento de los tiempos", "Paciencia"],
      fr:["Sagesse", "Dévouement à l'étude", "Discernement des temps", "Patience"],
      de:["Weisheit", "Hingabe zum Studium", "Zeitunterscheidung", "Geduld"],
      he:["חָכְמָה", "הַקְדָּשָׁה לְלִמּוּד", "בִּינַת הָעִתִּים", "סַבְלָנוּת"],
      ru:["Мудрость", "Преданность учёбе", "Различение времён", "Терпение"],
    },
    challenge: { pt:"Isolamento intelectual", en:"Intellectual isolation", es:"Aislamiento intelectual", fr:"Isolement intellectuel", de:"Intellektuelle Isolation", he:"בִּדּוּד אִינְטֶלֶקְטוּאָלִי", ru:"Интеллектуальная изоляция" },
    scripture: "Gênesis 49:14-15; 1 Crônicas 12:32",
  },
  {
    monthId: 3, monthName: "Sivan",
    tribe: "Zevulun", heb: "זְבוּלוּן", eng: "Zebulun",
    symbol: "⚓", mazal: "Gêmeos ♊", stone: "Esmeralda",
    stoneHeb: "בָּרֶקֶת", color: "#16a34a",
    blessing: { pt:"Zevulun habitará à beira do mar, será porto de navios. (Gn 49:13)", en:"Zebulun shall dwell by the seashore; he shall become a haven for ships. (Gen 49:13)", es:"Zabulón habitará en la costa del mar; será puerto de naves. (Gn 49:13)", fr:"Zabulon habitera sur la côte des mers, il sera sur la côte des navires. (Gn 49:13)", de:"Sebulon wird an der Anfurt des Meeres wohnen und an der Anfurt der Schiffe. (1. Mose 49:13)", he:"זְבוּלֻן לְחוֹף יַמִּים יִשְׁכֹּן וְהוּא לְחוֹף אֳנִיּוֹת. (בְּרֵאשִׁית מט:יג)", ru:"Завулон при береге морском будет жить и у пристани корабельной. (Быт 49:13)" },
    desc: { pt:"A tribo dos comerciantes e navegadores. Zevulun sustentava financeiramente os estudos de Yissachar, sendo modelo de parceria entre trabalho e Torá.", en:"The tribe of merchants and sailors. Zebulun financially supported Issachar's studies, being a model of partnership between work and Torah.", es:"La tribu de los comerciantes y navegantes. Zabulón sostenía financieramente los estudios de Isacar, siendo modelo de sociedad entre trabajo y Torá.", fr:"La tribu des marchands et navigateurs. Zabulon soutenait financièrement les études d'Issacar, étant un modèle de partenariat entre travail et Torah.", de:"Der Stamm der Kaufleute und Seefahrer. Sebulon unterstützte finanziell Issachars Studien, ein Modell der Partnerschaft zwischen Arbeit und Tora.", he:"שֵׁבֶט הַסּוֹחֲרִים וְהַסַּפָּנִים. זְבוּלֻן פִּרְנֵס אֶת לִמּוּדֵי יִשָּׂשכָר, דֻּגְמָה לְשֻׁתָּפוּת בֵּין עֲבוֹדָה לְתוֹרָה.", ru:"Колено купцов и мореплавателей. Завулон финансово поддерживал учёбу Иссахара, будучи образцом партнёрства труда и Торы." },
    qualities: {
      pt:["Generosidade", "Espírito empreendedor", "Parceria", "Prosperidade"],
      en:["Generosity", "Entrepreneurial spirit", "Partnership", "Prosperity"],
      es:["Generosidad", "Espíritu emprendedor", "Sociedad", "Prosperidad"],
      fr:["Générosité", "Esprit d'entreprise", "Partenariat", "Prospérité"],
      de:["Großzügigkeit", "Unternehmergeist", "Partnerschaft", "Wohlstand"],
      he:["נְדִיבוּת", "רוּחַ יְזָמּוּת", "שֻׁתָּפוּת", "שִׂגְשׂוּג"],
      ru:["Щедрость", "Предпринимательский дух", "Партнёрство", "Процветание"],
    },
    challenge: { pt:"Materialismo excessivo", en:"Excessive materialism", es:"Materialismo excesivo", fr:"Matérialisme excessif", de:"Übermäßiger Materialismus", he:"מָטֶרְיָאלִיזְם מֻגְזָם", ru:"Чрезмерный материализм" },
    scripture: "Gênesis 49:13; Deuteronômio 33:18-19",
  },
  {
    monthId: 4, monthName: "Tammuz",
    tribe: "Reuven", heb: "רְאוּבֵן", eng: "Reuben",
    symbol: "🌊", mazal: "Câncer ♋", stone: "Cornalina",
    stoneHeb: "אֹדֶם", color: "#2563eb",
    blessing: { pt:"Reuven, tu és meu primogênito, minha força… (Gn 49:3)", en:"Reuben, you are my firstborn, my strength… (Gen 49:3)", es:"Rubén, tú eres mi primogénito, mi fuerza… (Gn 49:3)", fr:"Ruben, toi, mon premier-né, ma force… (Gn 49:3)", de:"Ruben, du bist mein erstgeborener Sohn, meine Kraft… (1. Mose 49:3)", he:"רְאוּבֵן בְּכֹרִי אַתָּה כֹּחִי… (בְּרֵאשִׁית מט:ג)", ru:"Рувим, первенец мой, сила моя… (Быт 49:3)" },
    desc: { pt:"O primogênito de Yaakov. Um mês de vulnerabilidade e reflexão. Tammuz foi mês de queda (bezerro de ouro), mas também de potencial de arrependimento e restauração.", en:"Yaakov's firstborn. A month of vulnerability and reflection. Tammuz was a month of downfall (golden calf), but also of potential repentance and restoration.", es:"El primogénito de Yaakov. Un mes de vulnerabilidad y reflexión. Tamuz fue mes de caída (becerro de oro), pero también de potencial arrepentimiento y restauración.", fr:"Le premier-né de Yaakov. Un mois de vulnérabilité et de réflexion. Tammouz fut un mois de chute (veau d'or), mais aussi de repentance et restauration potentielles.", de:"Jaakobs Erstgeborener. Ein Monat der Verletzlichkeit und Reflexion. Tammus war ein Monat des Falls (goldenes Kalb), aber auch möglicher Reue und Wiederherstellung.", he:"בְּכוֹר יַעֲקֹב. חֹדֶשׁ שֶׁל פְּגִיעוּת וְהִרְהוּר. תַּמּוּז הָיָה חֹדֶשׁ הַנְּפִילָה (עֵגֶל הַזָּהָב), אַךְ גַּם שֶׁל פּוֹטֶנְצְיָאל תְּשׁוּבָה.", ru:"Первенец Иакова. Месяц уязвимости и размышлений. Таммуз был месяцем падения (золотой телец), но также потенциального покаяния и восстановления." },
    qualities: {
      pt:["Sensibilidade", "Capacidade de arrependimento", "Empatia", "Visão"],
      en:["Sensitivity", "Capacity for repentance", "Empathy", "Vision"],
      es:["Sensibilidad", "Capacidad de arrepentimiento", "Empatía", "Visión"],
      fr:["Sensibilité", "Capacité de repentance", "Empathie", "Vision"],
      de:["Sensibilität", "Reuefähigkeit", "Empathie", "Vision"],
      he:["רְגִישׁוּת", "יְכֹלֶת תְּשׁוּבָה", "אֶמְפַּתְיָה", "חָזוֹן"],
      ru:["Чувствительность", "Способность к покаянию", "Эмпатия", "Видение"],
    },
    challenge: { pt:"Impulsividade e instabilidade emocional", en:"Impulsiveness and emotional instability", es:"Impulsividad e inestabilidad emocional", fr:"Impulsivité et instabilité émotionnelle", de:"Impulsivität und emotionale Instabilität", he:"אִימְפּוּלְסִיבִיּוּת וְחֹסֶר יַצִּיבוּת רִגְשִׁית", ru:"Импульсивность и эмоциональная нестабильность" },
    scripture: "Gênesis 49:3-4; Números 1:20-21",
  },
  {
    monthId: 5, monthName: "Av",
    tribe: "Shimon", heb: "שִׁמְעוֹן", eng: "Simeon",
    symbol: "🗡️", mazal: "Leão ♌", stone: "Esmeralda",
    stoneHeb: "נֹפֶךְ", color: "#7c3aed",
    blessing: { pt:"Shimon e Levi são irmãos; suas espadas são instrumentos de violência. (Gn 49:5)", en:"Simeon and Levi are brothers; their swords are instruments of violence. (Gen 49:5)", es:"Simeón y Leví son hermanos; sus armas son instrumentos de violencia. (Gn 49:5)", fr:"Siméon et Lévi sont frères; leurs glaives sont des instruments de violence. (Gn 49:5)", de:"Simeon und Levi sind Brüder, ihre Schwerter sind Werkzeuge der Gewalttat. (1. Mose 49:5)", he:"שִׁמְעוֹן וְלֵוִי אַחִים כְּלֵי חָמָס מְכֵרֹתֵיהֶם. (בְּרֵאשִׁית מט:ה)", ru:"Симеон и Левий братья, орудия жестокости мечи их. (Быт 49:5)" },
    desc: { pt:"A tribo do fervor e da intensidade. Av é o mês mais difícil do calendário (destruição do Templo), mas porta a semente da maior luz. O nome Shimon vem de 'ouvir'.", en:"The tribe of fervor and intensity. Av is the hardest month of the calendar (destruction of the Temple), but carries the seed of the greatest light. The name Shimon comes from 'to hear'.", es:"La tribu del fervor y la intensidad. Av es el mes más difícil del calendario (destrucción del Templo), pero porta la semilla de la mayor luz. El nombre Shimón viene de 'oír'.", fr:"La tribu de la ferveur et de l'intensité. Av est le mois le plus difficile du calendrier (destruction du Temple), mais porte la graine de la plus grande lumière.", de:"Der Stamm der Leidenschaft und Intensität. Av ist der schwerste Monat des Kalenders (Zerstörung des Tempels), trägt aber den Samen des größten Lichts.", he:"שֵׁבֶט הַלַּהַט וְהָעֹצְמָה. אָב הוּא הַחֹדֶשׁ הַקָּשֶׁה בְּיוֹתֵר בַּלּוּחַ (חֻרְבַּן הַמִּקְדָּשׁ), אַךְ נוֹשֵׂא אֶת זֶרַע הָאוֹר הַגָּדוֹל בְּיוֹתֵר.", ru:"Колено пыла и интенсивности. Ав — самый трудный месяц календаря (разрушение Храма), но несёт семя величайшего света." },
    qualities: {
      pt:["Fervor espiritual", "Intensidade", "Ouvir a voz de Deus", "Transformação"],
      en:["Spiritual fervor", "Intensity", "Hearing God's voice", "Transformation"],
      es:["Fervor espiritual", "Intensidad", "Oír la voz de Dios", "Transformación"],
      fr:["Ferveur spirituelle", "Intensité", "Entendre la voix de Dieu", "Transformation"],
      de:["Geistlicher Eifer", "Intensität", "Gottes Stimme hören", "Verwandlung"],
      he:["לַהַט רוּחָנִי", "עֹצְמָה", "שְׁמִיעַת קוֹל ה'", "טְרַנְספוֹרְמַצְיָה"],
      ru:["Духовный пыл", "Интенсивность", "Слышание голоса Бога", "Трансформация"],
    },
    challenge: { pt:"Ira e impulsividade destrutiva", en:"Anger and destructive impulsiveness", es:"Ira e impulsividad destructiva", fr:"Colère et impulsivité destructrice", de:"Zorn und zerstörerische Impulsivität", he:"כַּעַס וְאִימְפּוּלְסִיבִיּוּת הַרְסָנִית", ru:"Гнев и разрушительная импульсивность" },
    scripture: "Gênesis 49:5-7; Números 1:22-23",
  },
  {
    monthId: 6, monthName: "Elul",
    tribe: "Gad", heb: "גָּד", eng: "Gad",
    symbol: "⚔️", mazal: "Virgem ♍", stone: "Diamante",
    stoneHeb: "יָהֲלֹם", color: "#0891b2",
    blessing: { pt:"Gad, um exército o atacará, mas ele atacará o calcanhar deles. (Gn 49:19)", en:"Gad, a troop shall press upon him, but he shall press upon their heel. (Gen 49:19)", es:"Gad, ejército lo asaltará, mas él asaltará su retaguardia. (Gn 49:19)", fr:"Gad sera assailli par des bandes armées, mais il les assaillira et les poursuivra. (Gn 49:19)", de:"Gad, Kriegsscharen werden ihn drängen, er aber wird sie in die Ferse drängen. (1. Mose 49:19)", he:"גָּד גְּדוּד יְגוּדֶנּוּ וְהוּא יָגֻד עָקֵב. (בְּרֵאשִׁית מט:יט)", ru:"Гад, толпа будет теснить его, но он оттеснит её по пятам. (Быт 49:19)" },
    desc: { pt:"A tribo dos guerreiros e dos vencedores. Elul é o mês de preparação e teshuvá (arrependimento) antes de Rosh Hashaná — o guerreiro se prepara para o julgamento.", en:"The tribe of warriors and conquerors. Elul is the month of preparation and teshuvah (repentance) before Rosh Hashanah — the warrior prepares for judgment.", es:"La tribu de los guerreros y vencedores. Elul es el mes de preparación y teshuvá (arrepentimiento) antes de Rosh Hashaná — el guerrero se prepara para el juicio.", fr:"La tribu des guerriers et des vainqueurs. Elloul est le mois de préparation et de techouva (repentance) avant Roch Hachana — le guerrier se prépare au jugement.", de:"Der Stamm der Krieger und Sieger. Elul ist der Monat der Vorbereitung und Teschuwa (Buße) vor Rosch Haschana — der Krieger bereitet sich auf das Gericht vor.", he:"שֵׁבֶט הַלּוֹחֲמִים וְהַמְּנַצְּחִים. אֱלוּל הוּא חֹדֶשׁ הַהֲכָנָה וְהַתְּשׁוּבָה לִפְנֵי רֹאשׁ הַשָּׁנָה — הַלּוֹחֵם מִתְכּוֹנֵן לַמִּשְׁפָּט.", ru:"Колено воинов и победителей. Элул — месяц подготовки и тшувы (покаяния) перед Рош ха-Шана — воин готовится к суду." },
    qualities: {
      pt:["Coragem militar", "Resiliência", "Preparação", "Superação"],
      en:["Military courage", "Resilience", "Preparation", "Overcoming"],
      es:["Coraje militar", "Resiliencia", "Preparación", "Superación"],
      fr:["Courage militaire", "Résilience", "Préparation", "Dépassement"],
      de:["Militärischer Mut", "Widerstandsfähigkeit", "Vorbereitung", "Überwindung"],
      he:["אֹמֶץ צְבָאִי", "חֹסֶן", "הֲכָנָה", "הִתְגַּבְּרוּת"],
      ru:["Военная смелость", "Стойкость", "Подготовка", "Преодоление"],
    },
    challenge: { pt:"Agressividade desnecessária", en:"Unnecessary aggressiveness", es:"Agresividad innecesaria", fr:"Agressivité inutile", de:"Unnötige Aggressivität", he:"תּוֹקְפָנוּת מְיֻתֶּרֶת", ru:"Ненужная агрессивность" },
    scripture: "Gênesis 49:19; Deuteronômio 33:20-21",
  },
  {
    monthId: 7, monthName: "Tishrei",
    tribe: "Efraim", heb: "אֶפְרַיִם", eng: "Ephraim",
    symbol: "🌳", mazal: "Libra ♎", stone: "Ônix",
    stoneHeb: "שֹׁהַם", color: "#059669",
    blessing: { pt:"Seu descendente se tornará uma multidão de nações. (Gn 48:19)", en:"His descendants shall become a multitude of nations. (Gen 48:19)", es:"Su descendencia llegará a ser multitud de naciones. (Gn 48:19)", fr:"Sa postérité deviendra une multitude de nations. (Gn 48:19)", de:"Sein Same wird eine Menge von Völkern werden. (1. Mose 48:19)", he:"וְזַרְעוֹ יִהְיֶה מְלֹא הַגּוֹיִם. (בְּרֵאשִׁית מח:יט)", ru:"Потомство его будет множеством народов. (Быт 48:19)" },
    desc: { pt:"Filho de Yosef, recebeu a bênção do primogênito. Tishrei é o mês mais rico em festas — Rosh Hashaná, Yom Kippur e Sukkot. Efraim representa multiplicação e renovação.", en:"Son of Yosef, he received the firstborn's blessing. Tishrei is the month richest in feasts — Rosh Hashanah, Yom Kippur and Sukkot. Ephraim represents multiplication and renewal.", es:"Hijo de Yosef, recibió la bendición del primogénito. Tishrei es el mes más rico en fiestas — Rosh Hashaná, Yom Kipur y Sucot. Efraín representa multiplicación y renovación.", fr:"Fils de Yosef, il reçut la bénédiction du premier-né. Tichri est le mois le plus riche en fêtes — Roch Hachana, Yom Kippour et Souccot. Éphraïm représente la multiplication et le renouveau.", de:"Sohn von Josef, erhielt den Erstgeburtssegen. Tischri ist der festreichste Monat — Rosch Haschana, Jom Kippur und Sukkot. Ephraim steht für Vermehrung und Erneuerung.", he:"בְּנוֹ שֶׁל יוֹסֵף, קִבֵּל אֶת בִּרְכַּת הַבְּכוֹרָה. תִּשְׁרֵי הוּא הַחֹדֶשׁ הֶעָשִׁיר בְּיוֹתֵר בְּמוֹעֲדִים360 — רֹאשׁ הַשָּׁנָה, יוֹם כִּפּוּר וְסֻכּוֹת.", ru:"Сын Иосифа, получил благословение первенца. Тишрей — месяц, богатейший праздниками — Рош ха-Шана, Йом Кипур и Суккот. Ефрем представляет умножение и обновление." },
    qualities: {
      pt:["Multiplicação", "Renovação", "Equilíbrio (balança de Tishrei)", "Frutificação"],
      en:["Multiplication", "Renewal", "Balance (Tishrei scales)", "Fruitfulness"],
      es:["Multiplicación", "Renovación", "Equilibrio (balanza de Tishrei)", "Fructificación"],
      fr:["Multiplication", "Renouveau", "Équilibre (balance de Tichri)", "Fructification"],
      de:["Vermehrung", "Erneuerung", "Gleichgewicht (Tischri-Waage)", "Fruchtbarkeit"],
      he:["רִבּוּי", "הִתְחַדְּשׁוּת", "אִזּוּן (מֹאזְנֵי תִּשְׁרֵי)", "הַפְרָיָה"],
      ru:["Умножение", "Обновление", "Равновесие (весы Тишрея)", "Плодовитость"],
    },
    challenge: { pt:"Dispersão de foco", en:"Loss of focus", es:"Dispersión de enfoque", fr:"Dispersion de la concentration", de:"Zerstreuung des Fokus", he:"פִּזּוּר רֹאשׁ", ru:"Рассеивание фокуса" },
    scripture: "Gênesis 48:14-20; Deuteronômio 33:17",
  },
  {
    monthId: 8, monthName: "Cheshvan",
    tribe: "Menashe", heb: "מְנַשֶּׁה", eng: "Manasseh",
    symbol: "💧", mazal: "Escorpião ♏", stone: "Ágata",
    stoneHeb: "שְׁבוֹ", color: "#1d4ed8",
    blessing: { pt:"Que Deus te faça como Efraim e Menashe. (Gn 48:20)", en:"May God make you as Ephraim and Manasseh. (Gen 48:20)", es:"Que Dios te haga como a Efraín y a Manasés. (Gn 48:20)", fr:"Que Dieu te rende semblable à Éphraïm et à Manassé. (Gn 48:20)", de:"Gott setze dich wie Ephraim und Manasse. (1. Mose 48:20)", he:"יְשִׂמְךָ אֱלֹהִים כְּאֶפְרַיִם וְכִמְנַשֶּׁה. (בְּרֵאשִׁית מח:כ)", ru:"Бог да сотворит тебе, как Ефрему и Манассии. (Быт 48:20)" },
    desc: { pt:"O primogênito de Yosef. Cheshvan é o único mês sem festas — um mês de introspecção profunda e trabalho silencioso. Menashe representa esquecer o sofrimento passado e seguir em frente.", en:"Yosef's firstborn. Cheshvan is the only month without feasts — a month of deep introspection and quiet work. Manasseh represents forgetting past suffering and moving forward.", es:"El primogénito de Yosef. Cheshvan es el único mes sin fiestas — un mes de introspección profunda y trabajo silencioso. Manasés representa olvidar el sufrimiento pasado y seguir adelante.", fr:"Le premier-né de Yosef. Hesvan est le seul mois sans fêtes — un mois d'introspection profonde et de travail silencieux. Manassé représente l'oubli des souffrances passées.", de:"Josefs Erstgeborener. Cheschwan ist der einzige Monat ohne Feste — ein Monat tiefer Selbstreflexion und stiller Arbeit. Manasse steht für das Vergessen vergangenen Leids.", he:"בְּכוֹר יוֹסֵף. חֶשְׁוָן הוּא הַחֹדֶשׁ הַיָּחִיד לְלֹא מוֹעֲדִים360 — חֹדֶשׁ שֶׁל הִתְבּוֹנְנוּת עֲמֻקָּה וַעֲבוֹדָה שְׁקֵטָה.", ru:"Первенец Иосифа. Хешван — единственный месяц без праздников — месяц глубокой самоанализа и тихой работы. Манассия представляет забвение прошлых страданий." },
    qualities: {
      pt:["Introspecção", "Superação do passado", "Trabalho silencioso", "Perseverança"],
      en:["Introspection", "Overcoming the past", "Quiet work", "Perseverance"],
      es:["Introspección", "Superación del pasado", "Trabajo silencioso", "Perseverancia"],
      fr:["Introspection", "Dépassement du passé", "Travail silencieux", "Persévérance"],
      de:["Selbstreflexion", "Vergangenheitsbewältigung", "Stille Arbeit", "Beharrlichkeit"],
      he:["הִתְבּוֹנְנוּת פְּנִימִית", "הִתְגַּבְּרוּת עַל הֶעָבָר", "עֲבוֹדָה שְׁקֵטָה", "הַתְמָדָה"],
      ru:["Интроспекция", "Преодоление прошлого", "Тихая работа", "Настойчивость"],
    },
    challenge: { pt:"Melancolia e isolamento", en:"Melancholy and isolation", es:"Melancolía y aislamiento", fr:"Mélancolie et isolement", de:"Melancholie und Isolation", he:"מְלַנְכוֹלְיָה וּבִדּוּד", ru:"Меланхолия и изоляция" },
    scripture: "Gênesis 41:51; 48:14-20",
  },
  {
    monthId: 9, monthName: "Kislev",
    tribe: "Binyamin", heb: "בִּנְיָמִן", eng: "Benjamin",
    symbol: "🐺", mazal: "Sagitário ♐", stone: "Ametista",
    stoneHeb: "אַחְלָמָה", color: "#7c3aed",
    blessing: { pt:"Binyamin é um lobo que devora; de manhã consome a presa. (Gn 49:27)", en:"Benjamin is a ravenous wolf; in the morning he shall devour the prey. (Gen 49:27)", es:"Benjamín es lobo arrebatador; a la mañana comerá la presa. (Gn 49:27)", fr:"Benjamin est un loup qui déchire; le matin, il dévore la proie. (Gn 49:27)", de:"Benjamin ist ein reißender Wolf; am Morgen wird er Raub fressen. (1. Mose 49:27)", he:"בִּנְיָמִין זְאֵב יִטְרָף בַּבֹּקֶר יֹאכַל עַד. (בְּרֵאשִׁית מט:כז)", ru:"Вениамин, хищный волк, утром будет есть ловитву. (Быт 49:27)" },
    desc: { pt:"O filho amado de Yaakov e Raquel. Kislev é o mês de Chanukah — a festa da luz e da dedicação. Binyamin era o único filho nascido em Eretz Israel, representando santidade e intimidade com o sagrado.", en:"The beloved son of Yaakov and Rachel. Kislev is the month of Chanukah — the feast of light and dedication. Benjamin was the only son born in Eretz Israel, representing holiness and intimacy with the sacred.", es:"El hijo amado de Yaakov y Raquel. Kislev es el mes de Janucá — la fiesta de la luz y la dedicación. Benjamín fue el único hijo nacido en Eretz Israel, representando santidad e intimidad con lo sagrado.", fr:"Le fils bien-aimé de Yaakov et Rachel. Kislev est le mois de Hanoucca — la fête de la lumière et de la dédicace. Benjamin était le seul fils né en Eretz Israël, représentant la sainteté.", de:"Der geliebte Sohn von Jaakob und Rachel. Kislev ist der Monat von Chanukka — das Lichter- und Weihefest. Benjamin war der einzige in Eretz Israel geborene Sohn, ein Symbol der Heiligkeit.", he:"הַבֵּן הָאָהוּב שֶׁל יַעֲקֹב וְרָחֵל. כִּסְלֵו הוּא חֹדֶשׁ הַחֲנֻכָּה — חַג הָאוֹר וְהַחֲנֻכָּה. בִּנְיָמִין הָיָה הַבֵּן הַיָּחִיד שֶׁנּוֹלַד בְּאֶרֶץ יִשְׂרָאֵל.", ru:"Любимый сын Иакова и Рахили. Кислев — месяц Хануки — праздника света и посвящения. Вениамин был единственным сыном, рождённым в Эрец Исраэль." },
    qualities: {
      pt:["Intimidade com o sagrado", "Proteção feroz", "Devoção", "Luz na escuridão"],
      en:["Intimacy with the sacred", "Fierce protection", "Devotion", "Light in darkness"],
      es:["Intimidad con lo sagrado", "Protección feroz", "Devoción", "Luz en la oscuridad"],
      fr:["Intimité avec le sacré", "Protection féroce", "Dévotion", "Lumière dans les ténèbres"],
      de:["Nähe zum Heiligen", "Wilder Schutz", "Hingabe", "Licht in der Dunkelheit"],
      he:["קִרְבָה לַקֹּדֶשׁ", "הֲגָנָה עַזָּה", "מְסִירוּת", "אוֹר בַּחֹשֶׁךְ"],
      ru:["Близость к святому", "Яростная защита", "Преданность", "Свет во тьме"],
    },
    challenge: { pt:"Impulsividade e territorialismo", en:"Impulsiveness and territorialism", es:"Impulsividad y territorialismo", fr:"Impulsivité et territorialité", de:"Impulsivität und Territorialverhalten", he:"אִימְפּוּלְסִיבִיּוּת וְטֶרִיטוֹרְיָאלִיּוּת", ru:"Импульсивность и территориальность" },
    scripture: "Gênesis 49:27; Deuteronômio 33:12",
  },
  {
    monthId: 10, monthName: "Tevet",
    tribe: "Dan", heb: "דָּן", eng: "Dan",
    symbol: "🐍", mazal: "Capricórnio ♑", stone: "Berilo",
    stoneHeb: "תַּרְשִׁישׁ", color: "#374151",
    blessing: { pt:"Dã julgará seu povo como uma das tribos de Israel. (Gn 49:16)", en:"Dan shall judge his people as one of the tribes of Israel. (Gen 49:16)", es:"Dan juzgará a su pueblo como una de las tribus de Israel. (Gn 49:16)", fr:"Dan jugera son peuple, comme l'une des tribus d'Israël. (Gn 49:16)", de:"Dan wird sein Volk richten als eine der Stämme Israels. (1. Mose 49:16)", he:"דָּן יָדִין עַמּוֹ כְּאַחַד שִׁבְטֵי יִשְׂרָאֵל. (בְּרֵאשִׁית מט:טז)", ru:"Дан будет судить народ свой, как одно из колен Израиля. (Быт 49:16)" },
    desc: { pt:"A tribo dos juízes e do discernimento. Tevet é um mês sombrio (jejum do 10 de Tevet), mas Dan representa a capacidade de distinguir o bem do mal e fazer justiça.", en:"The tribe of judges and discernment. Tevet is a somber month (fast of the 10th of Tevet), but Dan represents the ability to distinguish good from evil and administer justice.", es:"La tribu de los jueces y el discernimiento. Tevet es un mes sombrío (ayuno del 10 de Tevet), pero Dan representa la capacidad de distinguir el bien del mal y hacer justicia.", fr:"La tribu des juges et du discernement. Tevet est un mois sombre (jeûne du 10 Tevet), mais Dan représente la capacité de distinguer le bien du mal et de rendre justice.", de:"Der Stamm der Richter und der Unterscheidung. Tevet ist ein düsterer Monat (Fasten am 10. Tevet), aber Dan steht für die Fähigkeit, Gut und Böse zu unterscheiden.", he:"שֵׁבֶט הַשּׁוֹפְטִים וְהַהֲבָנָה. טֵבֵת הוּא חֹדֶשׁ קוֹדֵר (צוֹם עֲשָׂרָה בְּטֵבֵת), אַךְ דָּן מְיַצֵּג אֶת הַיְּכֹלֶת לְהַבְחִין בֵּין טוֹב לְרַע.", ru:"Колено судей и различения. Тевет — мрачный месяц (пост 10 Тевета), но Дан представляет способность отличать добро от зла и творить правосудие." },
    qualities: {
      pt:["Discernimento", "Senso de justiça", "Percepção aguçada", "Julgamento justo"],
      en:["Discernment", "Sense of justice", "Sharp perception", "Fair judgment"],
      es:["Discernimiento", "Sentido de justicia", "Percepción aguda", "Juicio justo"],
      fr:["Discernement", "Sens de la justice", "Perception aiguë", "Jugement équitable"],
      de:["Unterscheidungsvermögen", "Gerechtigkeitssinn", "Scharfe Wahrnehmung", "Faires Urteil"],
      he:["שִׁפּוּט", "חוּשׁ צֶדֶק", "תְּפִיסָה חַדָּה", "מִשְׁפָּט הוֹגֵן"],
      ru:["Различение", "Чувство справедливости", "Острое восприятие", "Справедливый суд"],
    },
    challenge: { pt:"Cinismo e julgamento excessivo", en:"Cynicism and excessive judgment", es:"Cinismo y juicio excesivo", fr:"Cynisme et jugement excessif", de:"Zynismus und übermäßiges Urteilen", he:"צִינִיּוּת וּשְׁפִיטָה מֻגְזֶמֶת", ru:"Цинизм и чрезмерное осуждение" },
    scripture: "Gênesis 49:16-18; Juízes 13-16 (Sansão)",
  },
  {
    monthId: 11, monthName: "Shevat",
    tribe: "Asher", heb: "אָשֵׁר", eng: "Asher",
    symbol: "🌿", mazal: "Aquário ♒", stone: "Berilo",
    stoneHeb: "שֹׁהַם", color: "#65a30d",
    blessing: { pt:"De Asher virá pão excelente; ele produzirá delícias reais. (Gn 49:20)", en:"Bread from Asher shall be rich, and he shall yield royal dainties. (Gen 49:20)", es:"El pan de Aser será substancioso, y él dará deleites reales. (Gn 49:20)", fr:"Aser produit une nourriture excellente; il fournira les mets délicats des rois. (Gn 49:20)", de:"Von Asser kommt fettes Brot, und er wird königliche Leckerbissen liefern. (1. Mose 49:20)", he:"מֵאָשֵׁר שְׁמֵנָה לַחְמוֹ וְהוּא יִתֵּן מַעֲדַנֵּי מֶלֶךְ. (בְּרֵאשִׁית מט:כ)", ru:"Для Асира — хлеб его тучен, и он будет доставлять царские яства. (Быт 49:20)" },
    desc: { pt:"A tribo da abundância e das bênçãos materiais. Shevat é o Ano Novo das Árvores (Tu BiShvat) — tempo de renovação e gratidão pelos frutos da terra. Asher representa alegria e contentamento.", en:"The tribe of abundance and material blessings. Shevat is the New Year of Trees (Tu BiShvat) — a time of renewal and gratitude for the fruits of the earth. Asher represents joy and contentment.", es:"La tribu de la abundancia y las bendiciones materiales. Shevat es el Año Nuevo de los Árboles (Tu BiShvat) — tiempo de renovación y gratitud por los frutos de la tierra.", fr:"La tribu de l'abondance et des bénédictions matérielles. Shevat est le Nouvel An des Arbres (Tou BiShvat) — temps de renouveau et de gratitude pour les fruits de la terre.", de:"Der Stamm des Überflusses und materieller Segnungen. Schwat ist das Neujahr der Bäume (Tu BiSchwat) — Zeit der Erneuerung und Dankbarkeit für die Früchte der Erde.", he:"שֵׁבֶט הַשֶּׁפַע וְהַבְּרָכוֹת הַגַּשְׁמִיּוֹת. שְׁבָט הוּא רֹאשׁ הַשָּׁנָה לָאִילָנוֹת (טוּ בִּשְׁבָט) — זְמַן הִתְחַדְּשׁוּת וְהַכָּרַת תּוֹדָה.", ru:"Колено изобилия и материальных благословений. Шват — Новый год деревьев (Ту би-Шват) — время обновления и благодарности за плоды земли." },
    qualities: {
      pt:["Alegria", "Abundância", "Gratidão", "Contentamento"],
      en:["Joy", "Abundance", "Gratitude", "Contentment"],
      es:["Alegría", "Abundancia", "Gratitud", "Contentamiento"],
      fr:["Joie", "Abondance", "Gratitude", "Contentement"],
      de:["Freude", "Überfluss", "Dankbarkeit", "Zufriedenheit"],
      he:["שִׂמְחָה", "שֶׁפַע", "הַכָּרַת תּוֹדָה", "שְׂבִיעוּת רָצוֹן"],
      ru:["Радость", "Изобилие", "Благодарность", "Довольство"],
    },
    challenge: { pt:"Conformismo e acomodação", en:"Conformism and complacency", es:"Conformismo y acomodación", fr:"Conformisme et complaisance", de:"Konformismus und Selbstzufriedenheit", he:"קוֹנְפוֹרְמִיזְם וְשַׁאֲנַנּוּת", ru:"Конформизм и самоуспокоенность" },
    scripture: "Gênesis 49:20; Deuteronômio 33:24-25",
  },
  {
    monthId: 12, monthName: "Adar",
    tribe: "Naftali", heb: "נַפְתָּלִי", eng: "Naphtali",
    symbol: "🦌", mazal: "Peixes ♓", stone: "Ametista",
    stoneHeb: "אַחְלָמָה", color: "#0284c7",
    blessing: { pt:"Naftali é uma gazela solta, que pronuncia belas palavras. (Gn 49:21)", en:"Naphtali is a doe let loose, giving beautiful words. (Gen 49:21)", es:"Neftalí es una cierva suelta, que pronuncia dichos hermosos. (Gn 49:21)", fr:"Nephtali est une biche en liberté; il profère de belles paroles. (Gn 49:21)", de:"Naphtali ist eine losgelassene Hirschkuh, die schöne Worte spricht. (1. Mose 49:21)", he:"נַפְתָּלִי אַיָּלָה שְׁלֻחָה הַנֹּתֵן אִמְרֵי שָׁפֶר. (בְּרֵאשִׁית מט:כא)", ru:"Неффалим — серна стройная; он говорит прекрасные изречения. (Быт 49:21)" },
    desc: { pt:"A tribo da leveza, alegria e belas palavras. Adar é o mês de Purim — alegria e celebração. Naftali era veloz como uma gazela, representando espiritualidade ágil e palavras inspiradas.", en:"The tribe of lightness, joy and beautiful words. Adar is the month of Purim — joy and celebration. Naphtali was swift as a doe, representing agile spirituality and inspired words.", es:"La tribu de la ligereza, alegría y palabras hermosas. Adar es el mes de Purim — alegría y celebración. Neftalí era veloz como una cierva, representando espiritualidad ágil.", fr:"La tribu de la légèreté, la joie et les belles paroles. Adar est le mois de Pourim — joie et célébration. Nephtali était rapide comme une biche, représentant une spiritualité agile.", de:"Der Stamm der Leichtigkeit, Freude und schönen Worte. Adar ist der Monat von Purim — Freude und Feier. Naphtali war schnell wie eine Hirschkuh, agile Spiritualität.", he:"שֵׁבֶט הַקַּלּוּת, הַשִּׂמְחָה וְהַמִּלִּים הַיָּפוֹת. אֲדָר הוּא חֹדֶשׁ הַפּוּרִים — שִׂמְחָה וְחֲגִיגָה. נַפְתָּלִי הָיָה מָהִיר כְּאַיָּלָה.", ru:"Колено лёгкости, радости и красивых слов. Адар — месяц Пурима — радости и празднования. Неффалим был быстр, как серна, представляя гибкую духовность." },
    qualities: {
      pt:["Alegria", "Leveza", "Eloquência", "Agilidade espiritual"],
      en:["Joy", "Lightness", "Eloquence", "Spiritual agility"],
      es:["Alegría", "Ligereza", "Elocuencia", "Agilidad espiritual"],
      fr:["Joie", "Légèreté", "Éloquence", "Agilité spirituelle"],
      de:["Freude", "Leichtigkeit", "Eloquenz", "Geistliche Beweglichkeit"],
      he:["שִׂמְחָה", "קַלּוּת", "רְהִיטוּת", "זְרִיזוּת רוּחָנִית"],
      ru:["Радость", "Лёгкость", "Красноречие", "Духовная гибкость"],
    },
    challenge: { pt:"Superficialidade e inconstância", en:"Superficiality and inconsistency", es:"Superficialidad e inconstancia", fr:"Superficialité et inconstance", de:"Oberflächlichkeit und Unbeständigkeit", he:"שִׁטְחִיּוּת וְחֹסֶר עֲקֵבִיּוּת", ru:"Поверхностность и непостоянство" },
    scripture: "Gênesis 49:21; Deuteronômio 33:23",
  },
  {
    monthId: 13, monthName: "Adar II",
    tribe: "Naftali", heb: "נַפְתָּלִי", eng: "Naphtali",
    symbol: "🦌", mazal: "Peixes ♓", stone: "Ametista",
    stoneHeb: "אַחְלָמָה", color: "#0284c7",
    blessing: { pt:"Naftali é uma gazela solta, que pronuncia belas palavras. (Gn 49:21)", en:"Naphtali is a doe let loose, giving beautiful words. (Gen 49:21)", es:"Neftalí es una cierva suelta, que pronuncia dichos hermosos. (Gn 49:21)", fr:"Nephtali est une biche en liberté; il profère de belles paroles. (Gn 49:21)", de:"Naphtali ist eine losgelassene Hirschkuh, die schöne Worte spricht. (1. Mose 49:21)", he:"נַפְתָּלִי אַיָּלָה שְׁלֻחָה הַנֹּתֵן אִמְרֵי שָׁפֶר. (בְּרֵאשִׁית מט:כא)", ru:"Неффалим — серна стройная; он говорит прекрасные изречения. (Быт 49:21)" },
    desc: { pt:"Segundo Adar — em anos embolísmicos (bissextos). Purim é celebrado no Adar II nestes anos. A duplicidade do mês amplifica a alegria e a redenção.", en:"Second Adar — in embolismic (leap) years. Purim is celebrated in Adar II in these years. The duplication of the month amplifies joy and redemption.", es:"Segundo Adar — en años embolísmicos (bisiestos). Purim se celebra en Adar II en estos años. La duplicidad del mes amplifica la alegría y la redención.", fr:"Second Adar — les années embolismiques (bissextiles). Pourim est célébré en Adar II ces années-là. La duplication du mois amplifie la joie et la rédemption.", de:"Zweiter Adar — in Schaltjahren. Purim wird in diesen Jahren im Adar II gefeiert. Die Verdopplung des Monats verstärkt Freude und Erlösung.", he:"אֲדָר שֵׁנִי — בְּשָׁנִים מְעֻבָּרוֹת. פּוּרִים נֶחְגָּג בַּאֲדָר ב' בַּשָּׁנִים הַלָּלוּ. כֶּפֶל הַחֹדֶשׁ מַגְבִּיר אֶת הַשִּׂמְחָה וְהַגְּאֻלָּה.", ru:"Второй Адар — в високосные годы. Пурим празднуется в Адар II в эти годы. Удвоение месяца усиливает радость и искупление." },
    qualities: {
      pt:["Alegria duplicada", "Graça divina", "Redenção", "Renovação"],
      en:["Doubled joy", "Divine grace", "Redemption", "Renewal"],
      es:["Alegría duplicada", "Gracia divina", "Redención", "Renovación"],
      fr:["Joie doublée", "Grâce divine", "Rédemption", "Renouveau"],
      de:["Verdoppelte Freude", "Göttliche Gnade", "Erlösung", "Erneuerung"],
      he:["שִׂמְחָה כְּפוּלָה", "חֶסֶד אֱלֹהִי", "גְּאֻלָּה", "הִתְחַדְּשׁוּת"],
      ru:["Удвоенная радость", "Божественная благодать", "Искупление", "Обновление"],
    },
    challenge: { pt:"Inconstância", en:"Inconsistency", es:"Inconstancia", fr:"Inconstance", de:"Unbeständigkeit", he:"חֹסֶר עֲקֵבִיּוּת", ru:"Непостоянство" },
    scripture: "Ester 9:20-28",
  },
];
;

// Mapa de acesso rápido por ID
const TRIBE_BY_MONTH = Object.fromEntries(TRIBES.map(t => [t.monthId, t]));

// ─── CONVERSOR DE DATAS PAGE ──────────────────────────────────────────────────

function ConverterPage({ lang = "pt" }) {
  const t = useT(lang);
  const localeMap = { pt:"pt-BR", en:"en-US", es:"es-ES", fr:"fr-FR", de:"de-DE", he:"he-IL", ru:"ru-RU" };
  // Data hebraica: após 18h o dia já avançou
  const _civil   = getHebrewCivilDate();
  const today    = _civil;
  const todayStr = `${_civil.getFullYear()}-${String(_civil.getMonth()+1).padStart(2,"0")}-${String(_civil.getDate()).padStart(2,"0")}`;

  const [birthDate,   setBirthDate]   = useState(todayStr);
  const [convertDate, setConvertDate] = useState(todayStr);
  const [birthResult, setBirthResult] = useState(null);
  const [convResult,  setConvResult]  = useState(null);
  const [activeTab,   setActiveTab]   = useState("birth"); // "birth" | "convert"

  // Converte e calcula tribo ao montar
  useEffect(() => { doConvert(); doBirth(); }, []);

  function doBirth() {
    const [y,m,d] = birthDate.split("-").map(Number);
    if (!y||!m||!d) return;
    const hd    = gregorianToHebrew(y,m,d);
    const tribe = TRIBE_BY_MONTH[hd.month] || null;
    const feast = BIBLICAL_FEASTS.find(f => f.month===hd.month && hd.day>=f.day && hd.day<f.day+f.dur) || null;
    const weekday = new Date(y,m-1,d).toLocaleDateString(localeMap[lang] || "pt-BR",{weekday:"long"});
    const parasha = getParashaForBirthday(m, d);
    // Próximo aniversário hebraico (ano corrente gregoriano)
    setBirthResult({ hd, tribe, feast, weekday, parasha, gDate: new Date(y,m-1,d) });
  }

  function doConvert() {
    const [y,m,d] = convertDate.split("-").map(Number);
    if (!y||!m||!d) return;
    const hd    = gregorianToHebrew(y,m,d);
    const tribe = TRIBE_BY_MONTH[hd.month] || null;
    const feast = BIBLICAL_FEASTS.find(f => f.month===hd.month && hd.day>=f.day && hd.day<f.day+f.dur) || null;
    const weekdayHeb = ["Yom Rishon","Yom Sheni","Yom Shlishi","Yom Revi'i","Yom Chamishi","Yom Shishi","Shabat"];
    const wday = new Date(y,m-1,d).getDay();
    const parasha = getParashaForBirthday(m, d);
    setConvResult({ hd, tribe, feast, weekdayHeb: weekdayHeb[wday], wday, parasha });
  }

  // ── sub-components ──

  const TribeCard = ({ tribe, hd, compact=false }) => {
    if (!tribe) return null;
    return (
      <div style={{
        background: `${tribe.color}14`, border: `1px solid ${tribe.color}44`,
        borderRadius: 16, padding: compact ? "14px 16px" : 20,
      }}>
        {/* header */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:14 }}>
          <div style={{
            width: compact?52:64, height: compact?52:64, borderRadius:14, flexShrink:0,
            background: `${tribe.color}22`, border:`2px solid ${tribe.color}55`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize: compact?26:32,
          }}>{tribe.symbol}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
              <span style={{color:S.text,fontWeight:700,fontSize:compact?17:20}}>{tribe.tribe}</span>
              <span className="hebrew" style={{color:tribe.color,fontSize:compact?22:26}}>{tribe.heb}</span>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <span style={{background:`${tribe.color}22`,color:tribe.color,fontSize:10,fontWeight:600,
                padding:"2px 8px",borderRadius:20,border:`1px solid ${tribe.color}44`}}>
                {tribe.mazal}
              </span>
              <span style={{background:"rgba(212,168,67,0.15)",color:S.gold,fontSize:10,fontWeight:600,
                padding:"2px 8px",borderRadius:20,border:`1px solid ${S.goldBorder}`}}>
                💎 {tribe.stone}
              </span>
              <span style={{background:`${tribe.color}22`,color:tribe.color,fontSize:10,fontWeight:600,
                padding:"2px 8px",borderRadius:20,border:`1px solid ${tribe.color}44`}}>
                {t("monthOf").replace("{month}", tribe.monthName)}
              </span>
            </div>
          </div>
        </div>

        {/* bênção */}
        <div style={{background:ink(0.5),borderRadius:10,padding:"10px 14px",marginBottom:12}}>
          <div style={{color:S.gold,fontSize:10,fontWeight:700,marginBottom:4}}>{t("jacobsBlessing")}</div>
          <p style={{color:S.text,fontSize:12,fontStyle:"italic",lineHeight:1.6}}>{tribe.blessing[lang] || tribe.blessing.pt}</p>
        </div>

        {/* descrição */}
        <p style={{color:S.textMuted,fontSize:13,lineHeight:1.7,marginBottom:12}}>{tribe.desc[lang] || tribe.desc.pt}</p>

        {/* qualidades e desafio */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div style={{background:`${tribe.color}10`,borderRadius:10,padding:"10px 12px"}}>
            <div style={{color:tribe.color,fontSize:10,fontWeight:700,marginBottom:6}}>{t("giftsLabel")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {(tribe.qualities[lang] || tribe.qualities.pt).map(q => (
                <span key={q} style={{color:S.text,fontSize:11,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:tribe.color,flexShrink:0,display:"inline-block"}}/>
                  {q}
                </span>
              ))}
            </div>
          </div>
          <div style={{background:"rgba(239,68,68,0.08)",borderRadius:10,padding:"10px 12px"}}>
            <div style={{color:"#f87171",fontSize:10,fontWeight:700,marginBottom:6}}>{t("challengeLabel")}</div>
            <p style={{color:S.textMuted,fontSize:11,lineHeight:1.5}}>{tribe.challenge[lang] || tribe.challenge.pt}</p>
            <div style={{marginTop:8,color:S.gold,fontSize:10,fontStyle:"italic"}}>{tribe.scripture}</div>
          </div>
        </div>

        {/* pedra hoshen */}
        <div style={{background:"rgba(212,168,67,0.06)",border:`1px solid ${S.goldBorder}`,borderRadius:10,
          padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>💎</span>
          <div>
            <div style={{color:S.gold,fontSize:10,fontWeight:700}}>{t("hoshenStone")}</div>
            <div style={{color:S.text,fontSize:12}}>{tribe.stone} <span className="hebrew" style={{color:S.gold}}>— {tribe.stoneHeb}</span></div>
            <div style={{color:S.textMuted,fontSize:11}}>Êxodo 28:15-21 • {t("tribeLabel")}: {tribe.eng}</div>
          </div>
        </div>
      </div>
    );
  };

  const HebrewDateDisplay = ({ hd, label, sub }) => (
    <div style={{background:ink(0.5),borderRadius:14,padding:18,textAlign:"center"}}>
      <div style={{color:S.textMuted,fontSize:11,marginBottom:8}}>{label}</div>
      <div className="display-font" style={{fontSize:52,fontWeight:900,color:S.goldLight,lineHeight:1}}>{hd.day}</div>
      <div style={{color:S.text,fontWeight:600,fontSize:18,marginTop:4}}>{hd.monthName}</div>
      <div className="hebrew" style={{color:S.gold,fontSize:26}}>{hd.monthNameHeb}</div>
      <div style={{color:S.textMuted,fontSize:13,marginTop:4}}>{hd.year} AM</div>
      {sub && <div style={{color:S.gold,fontSize:11,marginTop:6}}>{sub}</div>}
    </div>
  );

  // ── render ──
  return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"24px 16px 100px"}}>
      <SectionTitle sub={t("converterSub")}>
        {t("converterTitle")}
      </SectionTitle>

      {/* Toggle */}
      <div style={{display:"flex",background:S.bgCard,border:`1px solid ${S.goldBorder}`,
        borderRadius:12,padding:4,marginBottom:24,gap:4}}>
        {[
          ["birth",   t("tabBirthday")],
          ["convert", t("tabConvertAny")],
        ].map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex:1, background: activeTab===id ? S.goldBg : "transparent",
            border:"none", color: activeTab===id ? S.goldLight : S.textMuted,
            borderRadius:8, padding:"10px 6px", fontSize:13, fontWeight:600, cursor:"pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* ══ ABA: ANIVERSÁRIO ══ */}
      {activeTab==="birth" && (
        <div className="fade-up">
          {/* Input */}
          <div style={{background:S.bgCard,border:`1px solid ${S.goldBorder}`,borderRadius:16,
            padding:20,marginBottom:20}}>
            <div style={{color:S.gold,fontWeight:700,fontSize:14,marginBottom:12}}>
              {t("enterBirthDate")}
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input type="date" value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                style={{flex:1,minWidth:160,background:ink(0.6),
                  border:`1px solid ${S.goldBorder}`,borderRadius:10,padding:"10px 14px",
                  color:S.text,fontSize:15,outline:"none",colorScheme:"dark"}}
              />
              <button onClick={doBirth} style={{
                background:`linear-gradient(135deg,${S.gold},${S.goldLight})`,
                border:"none",borderRadius:10,padding:"10px 24px",
                color:S.bg,fontWeight:700,fontSize:14,cursor:"pointer",whiteSpace:"nowrap",
              }}>{t("discover")}</button>
            </div>
          </div>

          {birthResult && (
            <div className="fade-up">
              {/* Data hebraica + weekday */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:20}}>
                <HebrewDateDisplay hd={birthResult.hd} label={t("yourBirthHebrew")}
                  sub={t("bornOnA").replace("{day}", birthResult.weekday)}/>
                <div style={{background:inkMid(0.5),borderRadius:14,padding:18}}>
                  <div style={{color:S.textMuted,fontSize:11,marginBottom:10}}>{t("biblicalSummary")}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>{t("hebrewMonthLabel")}</span>
                      <span style={{color:S.text,fontWeight:600}}>{birthResult.hd.monthName}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>{t("hebrewDayLabel")}</span>
                      <span style={{color:S.text,fontWeight:600}}>{birthResult.hd.day}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>{t("hebrewYearLabel")}</span>
                      <span style={{color:S.text,fontWeight:600}}>{birthResult.hd.year} AM</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>{t("tribeLabel")}</span>
                      <span style={{color:S.goldLight,fontWeight:700}}>{birthResult.tribe?.tribe || "—"}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>{t("mazalLabel")}</span>
                      <span style={{color:S.gold,fontWeight:600}}>{birthResult.tribe?.mazal || "—"}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>{t("stoneLabel")}</span>
                      <span style={{color:S.gold,fontWeight:600}}>💎 {birthResult.tribe?.stone || "—"}</span>
                    </div>
                    {birthResult.parasha && (
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                        <span style={{color:S.textMuted}}>{t("parashatLabel")}</span>
                        <span style={{color:S.goldLight,fontWeight:700}}>{birthResult.parasha.name}</span>
                      </div>
                    )}
                    {birthResult.feast && (
                      <div style={{marginTop:6,padding:"8px 10px",background:S.goldBg,borderRadius:8,
                        border:`1px solid ${S.goldBorder}`}}>
                        <div style={{color:S.goldLight,fontSize:11,fontWeight:700}}>
                          {birthResult.feast.emoji} {t("bornDuringFeast").replace("{feast}", birthResult.feast.name)}
                        </div>
                        <div style={{color:S.textMuted,fontSize:10,marginTop:2}}>{birthResult.feast.desc[lang] || birthResult.feast.desc.pt}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner da tribo */}
              {birthResult.tribe && (
                <>
                  <div style={{textAlign:"center",margin:"8px 0 16px"}}>
                    <div className="display-font" style={{color:S.goldLight,fontSize:18,fontWeight:700}}>
                      {t("yourTribeTitle")}
                    </div>
                    <p style={{color:S.textMuted,fontSize:12,marginTop:4}}>
                      {t("tribeBasedOn")}
                    </p>
                  </div>
                  <TribeCard tribe={birthResult.tribe} hd={birthResult.hd} />
                </>
              )}

              {/* Banner da Parashat do nascimento */}
              {birthResult.parasha && (
                <>
                  <div style={{textAlign:"center",margin:"24px 0 16px"}}>
                    <div className="display-font" style={{color:S.goldLight,fontSize:18,fontWeight:700}}>
                      {t("yourBirthParasha")}
                    </div>
                    <p style={{color:S.textMuted,fontSize:12,marginTop:4}}>
                      {t("birthParashaDesc")}
                    </p>
                  </div>
                  <div style={{
                    background:inkMid(0.35), border:`1px solid ${S.goldBorder}`,
                    borderRadius:16, padding:20,
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                      <div style={{
                        width:52,height:52,borderRadius:14,flexShrink:0,
                        background:S.goldBg,border:`2px solid ${S.goldBorder}`,
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,
                      }}>📜</div>
                      <div>
                        <div style={{color:S.text,fontWeight:700,fontSize:18}}>{birthResult.parasha.name}</div>
                        <div className="hebrew" style={{color:S.gold,fontSize:22}}>{birthResult.parasha.heb}</div>
                      </div>
                    </div>
                    <div style={{color:S.textMuted,fontSize:13,marginBottom:8}}>{birthResult.parasha.theme}</div>
                    <div style={{background:ink(0.4),borderRadius:10,padding:"10px 14px",display:"flex",flexDirection:"column",gap:4}}>
                      <div style={{color:S.text,fontSize:12}}>{t("torahLabelIcon")} <strong>{birthResult.parasha.ref}</strong></div>
                      {birthResult.parasha.haftara && (
                        <div style={{color:S.text,fontSize:12}}>{t("haftaraLabelIcon")} <strong>{birthResult.parasha.haftara}</strong></div>
                      )}
                      {birthResult.parasha.brit && (
                        <div style={{color:S.text,fontSize:12}}>{t("britLabelIcon")} <strong>{birthResult.parasha.brit}</strong></div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ ABA: CONVERTER DATA ══ */}
      {activeTab==="convert" && (
        <div className="fade-up">
          {/* Input */}
          <div style={{background:S.bgCard,border:`1px solid ${S.goldBorder}`,borderRadius:16,
            padding:20,marginBottom:20}}>
            <div style={{color:S.gold,fontWeight:700,fontSize:14,marginBottom:12}}>
              {t("gregorianDate")}
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input type="date" value={convertDate}
                onChange={e => setConvertDate(e.target.value)}
                style={{flex:1,minWidth:160,background:ink(0.6),
                  border:`1px solid ${S.goldBorder}`,borderRadius:10,padding:"10px 14px",
                  color:S.text,fontSize:15,outline:"none",colorScheme:"dark"}}
              />
              <button onClick={doConvert} style={{
                background:`linear-gradient(135deg,${S.gold},${S.goldLight})`,
                border:"none",borderRadius:10,padding:"10px 24px",
                color:S.bg,fontWeight:700,fontSize:14,cursor:"pointer",whiteSpace:"nowrap",
              }}>{t("convertBtn")}</button>
            </div>
          </div>

          {convResult && (
            <div className="fade-up">
              {/* Resultado principal */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:20}}>
                <HebrewDateDisplay hd={convResult.hd} label={t("hebrewDateResult")}
                  sub={convResult.weekdayHeb}/>
                {/* Conversão dupla */}
                <div style={{background:inkMid(0.5),borderRadius:14,padding:18}}>
                  <div style={{color:S.textMuted,fontSize:11,marginBottom:10}}>{t("equivalence")}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{background:ink(0.5),borderRadius:10,padding:"10px 12px"}}>
                      <div style={{color:S.textMuted,fontSize:10,marginBottom:3}}>{t("gregorianLabel")}</div>
                      <div style={{color:S.text,fontWeight:600,fontSize:14}}>
                        {new Date(convertDate+"T12:00:00").toLocaleDateString(localeMap[lang] || "pt-BR",
                          {day:"2-digit",month:"long",year:"numeric"})}
                      </div>
                    </div>
                    <div style={{background:S.goldBg,borderRadius:10,padding:"10px 12px",
                      border:`1px solid ${S.goldBorder}`}}>
                      <div style={{color:S.gold,fontSize:10,marginBottom:3}}>{t("hebrewLabel")}</div>
                      <div style={{color:S.goldLight,fontWeight:700,fontSize:14}}>
                        {convResult.hd.day} de {convResult.hd.monthName}{" "}
                        <span className="hebrew" style={{fontSize:16}}>{convResult.hd.monthNameHeb}</span>
                      </div>
                      <div style={{color:S.textMuted,fontSize:12}}>{convResult.hd.year} {t("annoMundi")}</div>
                    </div>
                    {/* dia da semana hebraico */}
                    <div style={{background:ink(0.5),borderRadius:10,padding:"10px 12px"}}>
                      <div style={{color:S.textMuted,fontSize:10,marginBottom:3}}>{t("weekdayHebrewLabel")}</div>
                      <div style={{color:convResult.wday===6?S.goldLight:S.text,fontWeight:600,fontSize:13}}>
                        {convResult.weekdayHeb}
                        {convResult.wday===6 && <span style={{color:S.gold}}> {t("itsShabat")}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Festa nessa data */}
              {convResult.feast && (
                <div style={{background:S.goldBg,border:`1px solid ${S.goldBorder}`,
                  borderRadius:14,padding:16,marginBottom:20}}>
                  <div style={{color:S.goldLight,fontWeight:700,fontSize:15,marginBottom:6}}>
                    {convResult.feast.emoji} {t("dateIsFeast").replace("{feast}", convResult.feast.name)}
                  </div>
                  <p style={{color:S.text,fontSize:13,lineHeight:1.6,marginBottom:6}}>{convResult.feast.desc[lang] || convResult.feast.desc.pt}</p>
                  <p style={{color:S.textMuted,fontSize:12,fontStyle:"italic"}}>{convResult.feast.sig[lang] || convResult.feast.sig.pt}</p>
                  <div style={{color:S.gold,fontSize:12,marginTop:6}}>📖 {convResult.feast.scripture}</div>
                </div>
              )}

              {/* Parashat correspondente à data */}
              {convResult.parasha && (
                <div style={{background:inkMid(0.35),border:`1px solid ${S.goldBorder}`,
                  borderRadius:14,padding:16,marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:18}}>📜</span>
                    <span style={{color:S.goldLight,fontWeight:700,fontSize:15}}>{convResult.parasha.name}</span>
                    <span className="hebrew" style={{color:S.gold,fontSize:18}}>{convResult.parasha.heb}</span>
                  </div>
                  <p style={{color:S.textMuted,fontSize:12,marginBottom:6}}>{convResult.parasha.theme}</p>
                  <div style={{color:S.text,fontSize:12}}>📚 {convResult.parasha.ref}</div>
                  {convResult.parasha.brit && (
                    <div style={{color:S.text,fontSize:12,marginTop:2}}>{t("britLabelIcon")} {convResult.parasha.brit}</div>
                  )}
                </div>
              )}

              {/* Tribo do mês */}
              {convResult.tribe && (
                <>
                  <div style={{textAlign:"center",margin:"8px 0 16px"}}>
                    <div className="display-font" style={{color:S.goldLight,fontSize:18,fontWeight:700}}>
                      {t("monthTribeTitle").replace("{month}", convResult.hd.monthName)}
                    </div>
                  </div>
                  <TribeCard tribe={convResult.tribe} hd={convResult.hd} compact />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tabela completa das 12 tribos ── */}
      <div style={{marginTop:36}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div className="display-font" style={{color:S.goldLight,fontSize:20,fontWeight:700}}>
            {t("allTribesTitle")}
          </div>
          <p style={{color:S.textMuted,fontSize:12,marginTop:4}}>
            {t("allTribesSub")}
          </p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
          {TRIBES.filter(tribe => tribe.monthId <= 12).map(tribe => (
            <div key={tribe.monthId} style={{
              background:`${tribe.color}0d`, border:`1px solid ${tribe.color}33`,
              borderRadius:13, padding:"12px 14px",
              transition:"all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = `${tribe.color}1a`}
              onMouseLeave={e => e.currentTarget.style.background = `${tribe.color}0d`}
            >
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:40,height:40,borderRadius:10,background:`${tribe.color}22`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                  {tribe.symbol}
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{color:S.text,fontWeight:700,fontSize:14}}>{tribe.tribe}</span>
                    <span className="hebrew" style={{color:tribe.color,fontSize:18}}>{tribe.heb}</span>
                  </div>
                  <div style={{color:S.textMuted,fontSize:11}}>{tribe.mazal} · {tribe.monthName}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {(tribe.qualities[lang] || tribe.qualities.pt).slice(0,2).map(q => (
                  <span key={q} style={{background:`${tribe.color}1a`,color:tribe.color,fontSize:10,
                    padding:"2px 8px",borderRadius:20,border:`1px solid ${tribe.color}33`}}>{q}</span>
                ))}
                <span style={{background:"rgba(212,168,67,0.1)",color:S.gold,fontSize:10,
                  padding:"2px 8px",borderRadius:20,border:`1px solid ${S.goldBorder}`}}>
                  💎 {tribe.stone}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROSH CHODESH PAGE ────────────────────────────────────────────────────────

function RoshChodeshPage({ lang = "pt" }) {
  const t = useT(lang);
  const localeMap = { pt:"pt-BR", en:"en-US", es:"es-ES", fr:"fr-FR", de:"de-DE", he:"he-IL", ru:"ru-RU" };
  const now      = new Date();
  const phase    = getMoonPhase(now);
  const moonEmoji = getMoonEmoji(phase);
  const phaseName = getMoonPhaseName(phase);
  const nextRC   = getNextRoshChodesh();
  const daysUntil = Math.ceil((new Date(nextRC.date) - now) / 86400000);
  const todayHeb = getTodayHebrew();

  // Moon animation percentage: 0=nova 50=cheia 100=nova
  const pct = (phase / 29.53) * 100;

  // All Rosh Chodesh this year with countdown
  const withCountdown = ROSH_CHODESH_5786.map(rc => {
    const diff = Math.ceil((new Date(rc.date) - now) / 86400000);
    return { ...rc, diff };
  });

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 100px" }}>
      <SectionTitle sub={t("roshChodeshSub")}>{t("roshChodeshTitle")}</SectionTitle>

      {/* ── Hero: fase atual ── */}
      <div className="fade-up" style={{
        background: "linear-gradient(135deg, rgba(15,23,60,0.95) 0%, rgba(30,20,80,0.8) 100%)",
        border: `1px solid rgba(180,160,255,0.3)`, borderRadius: 20,
        padding: 28, marginBottom: 20, position: "relative", overflow: "hidden", textAlign: "center",
      }}>
        {/* starfield decoration */}
        {[...Array(18)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            top: `${Math.sin(i * 137.5) * 40 + 50}%`,
            left: `${Math.cos(i * 137.5) * 45 + 50}%`,
            width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
            borderRadius: "50%", background: "white",
            opacity: 0.3 + (i % 4) * 0.15,
          }} />
        ))}

        {/* Moon display */}
        <div style={{ fontSize: 96, lineHeight: 1, marginBottom: 12,
          filter: "drop-shadow(0 0 20px rgba(200,180,255,0.6))" }}>
          {moonEmoji}
        </div>
        <h2 className="display-font" style={{ fontSize: 26, color: "#e8d5ff", marginBottom: 4 }}>
          {phaseName}
        </h2>
        <p style={{ color: "rgba(220,200,255,0.7)", fontSize: 13, marginBottom: 16 }}>
          {t("cycleDay").replace("{n}", Math.floor(phase) + 1)} • {phase.toFixed(1)} {t("daysSinceNewMoon")}
        </p>

        {/* Phase progress bar */}
        <div style={{ maxWidth: 320, margin: "0 auto 16px", background: "rgba(255,255,255,0.08)",
          borderRadius: 20, height: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 20,
            background: "linear-gradient(90deg, #6366f1, #a78bfa, #f5c842, #a78bfa, #6366f1)",
            width: `${pct}%`, transition: "width 0.5s ease",
          }} />
        </div>

        {/* Today hebrew date */}
        <div style={{ display: "inline-flex", gap: 16, background: "rgba(255,255,255,0.05)",
          borderRadius: 12, padding: "10px 20px", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ color: "rgba(220,200,255,0.6)", fontSize: 12 }}>
            {t("todayLabel2")} <strong style={{ color: "#e8d5ff" }}>
              {todayHeb.day} de {todayHeb.monthName}
            </strong>{" "}
            <span className="hebrew" style={{ color: "#a78bfa", fontSize: 16 }}>
              {todayHeb.monthNameHeb}
            </span>
          </div>
        </div>
      </div>

      {/* ── Próximo Rosh Chodesh ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(167,139,250,0.1))",
        border: "1px solid rgba(167,139,250,0.35)", borderRadius: 16, padding: 20, marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 52 }}>🌑</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "rgba(167,139,250,0.8)", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              {t("nextRoshChodesh")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <span className="display-font" style={{ color: "#e8d5ff", fontSize: 22, fontWeight: 700 }}>
                {nextRC.month}
              </span>
              <span className="hebrew" style={{ color: "#a78bfa", fontSize: 24 }}>{nextRC.heb}</span>
            </div>
            <div style={{ color: "rgba(220,200,255,0.6)", fontSize: 13 }}>
              📅 {new Date(nextRC.date).toLocaleDateString(localeMap[lang] || "pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
            <div style={{ color: "rgba(180,160,255,0.6)", fontSize: 12, marginTop: 3 }}>
              ✨ {nextRC.note}
            </div>
          </div>
          {/* Countdown */}
          <div style={{ textAlign: "center", background: "rgba(99,102,241,0.2)",
            borderRadius: 14, padding: "14px 20px", border: "1px solid rgba(167,139,250,0.3)" }}>
            <div className="display-font" style={{ fontSize: 42, fontWeight: 900, color: "#a78bfa", lineHeight: 1 }}>
              {daysUntil <= 0 ? "🌑" : daysUntil}
            </div>
            <div style={{ color: "rgba(220,200,255,0.6)", fontSize: 11, marginTop: 4 }}>
              {daysUntil <= 0 ? t("todayBadge") : daysUntil === 1 ? t("dayWord") : t("daysWord")}
            </div>
          </div>
        </div>
      </div>

      {/* ── Calendário completo de Rosh Chodesh ── */}
      <div style={{ marginBottom: 20 }}>
        <div className="display-font" style={{ color: S.goldLight, fontSize: 17, fontWeight: 700,
          marginBottom: 14, textAlign: "center" }}>
          {t("fullCalendarRC")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
          {withCountdown.map((rc, i) => {
            const isPast   = rc.diff < 0;
            const isToday  = rc.diff === 0;
            const isNext   = rc.month === nextRC.month && rc.date === nextRC.date;
            return (
              <div key={i} style={{
                background: isNext ? "rgba(99,102,241,0.15)" : isPast ? "rgba(255,255,255,0.02)" : S.bgCard,
                border: `1px solid ${isNext ? "rgba(167,139,250,0.5)" : isPast ? "rgba(255,255,255,0.06)" : S.goldBorder}`,
                borderRadius: 12, padding: "12px 14px", opacity: isPast ? 0.55 : 1,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ color: isNext ? "#a78bfa" : S.text, fontWeight: 700, fontSize: 14 }}>
                        {isPast ? "✓" : isToday ? "🌑" : "🌑"} {rc.month}
                      </span>
                      <span className="hebrew" style={{ color: isNext ? "#a78bfa" : S.gold, fontSize: 18 }}>
                        {rc.heb}
                      </span>
                    </div>
                    <div style={{ color: S.textMuted, fontSize: 11 }}>
                      {new Date(rc.date).toLocaleDateString(localeMap[lang] || "pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div style={{ color: "rgba(167,139,250,0.6)", fontSize: 11, marginTop: 2 }}>{rc.note}</div>
                  </div>
                  <div style={{
                    background: isNext ? "rgba(99,102,241,0.25)" : isPast ? "rgba(255,255,255,0.05)" : S.goldBg,
                    borderRadius: 8, padding: "4px 8px", fontSize: 11, fontWeight: 700,
                    color: isNext ? "#a78bfa" : isPast ? S.textMuted : S.gold, whiteSpace: "nowrap",
                  }}>
                    {isPast ? t("past") : isToday ? t("todayBang") : `${rc.diff}${t("dayWord")[0]}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Significado espiritual ── */}
      <div style={{ background: S.bgCard, border: `1px solid ${S.goldBorder}`, borderRadius: 16, padding: 20 }}>
        <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
          {t("roshChodeshMeaning")}
        </div>
        <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.8 }}>
          {T.roshChodeshText1[lang] || T.roshChodeshText1.pt}
        </p>
        <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.8, marginTop: 8 }}>
          {T.roshChodeshText2[lang] || T.roshChodeshText2.pt}
        </p>
        <div style={{ marginTop: 12, color: S.gold, fontSize: 12, fontStyle: "italic" }}>
          📖 Números 28:11-15 • Isaías 66:23 • Colossenses 2:16-17
        </div>
      </div>
    </div>
  );
}

// ─── VERSÍCULO DIÁRIO PAGE ─────────────────────────────────────────────────────

function VersePage({ lang = "pt" }) {
  const t = useT(lang);
  const localeMap = { pt:"pt-BR", en:"en-US", es:"es-ES", fr:"fr-FR", de:"de-DE", he:"he-IL", ru:"ru-RU" };
  const verse = useMemo(() => getDailyVerse(), []);
  const [showHeb, setShowHeb] = useState(true);
  const [showPt,  setShowPt]  = useState(true);
  const [copied,  setCopied]  = useState(false);
  const todayHeb = useMemo(() => getTodayHebrew(), []);
  const todayStr = new Date().toLocaleDateString(localeMap[lang] || "pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });

  const shareText = `📖 ${verse.ref}

${verse.heb}

"${verse.pt}"

— Moedim360 — Calendário Bíblico`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${t("dailyVerse")} — ${verse.ref}`, text: shareText });
    } else { handleCopy(); }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 100px" }}>
      <SectionTitle sub={`${todayStr} • ${todayHeb.day} de ${todayHeb.monthName} ${todayHeb.year} AM`}>
        {t("dailyVerse")}
      </SectionTitle>

      {/* Hero card */}
      <div className="fade-up" style={{
        background: `linear-gradient(160deg, ${inkMid(0.9)} 0%, rgba(212,168,67,0.08) 100%)`,
        border: `2px solid ${S.goldBorder}`, borderRadius: 24,
        padding: 32, marginBottom: 20, position: "relative", overflow: "hidden",
      }}>
        {/* decoração */}
        <div style={{ position:"absolute", top:-20, right:-10, fontSize:130, opacity:0.04,
          fontFamily:"'Frank Ruhl Libre',serif", lineHeight:1 }}>תּוֹרָה</div>

        {/* Referência */}
        <div style={{ position:"relative", textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:20,
            background: S.goldBg, border:`1px solid ${S.goldBorder}`,
            borderRadius:20, padding:"6px 18px" }}>
            <span style={{ color:S.gold, fontSize:16 }}>📖</span>
            <span className="display-font" style={{ color:S.goldLight, fontWeight:700, fontSize:15 }}>{verse.ref}</span>
          </div>

          {/* Texto hebraico */}
          {showHeb && (
            <div className="fade-up" style={{ marginBottom:20 }}>
              <p className="hebrew" style={{
                fontSize: 22, lineHeight: 1.9, color: S.goldLight,
                background:"rgba(212,168,67,0.06)", borderRadius:14,
                padding:"16px 20px", border:`1px solid ${S.goldBorder}`,
                textAlign:"right",
              }}>
                {verse.heb}
              </p>
            </div>
          )}

          {/* Divisor */}
          {showHeb && showPt && (
            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"0 0 20px" }}>
              <div style={{ flex:1, height:1, background:S.goldBorder }} />
              <span style={{ color:S.gold, fontSize:18 }}>✡</span>
              <div style={{ flex:1, height:1, background:S.goldBorder }} />
            </div>
          )}

          {/* Texto em português */}
          {showPt && (
            <div className="fade-up">
              <p className="display-font" style={{
                fontSize:20, lineHeight:1.7, color:S.text, fontStyle:"italic",
                textAlign:"center",
              }}>
                "{verse.pt}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controles de exibição */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", justifyContent:"center" }}>
        {[
          [showHeb, setShowHeb, "עִב", t("verseHebrew")],
          [showPt,  setShowPt,  "PT",  t("versePortuguese")],
        ].map(([active, setter, abbr, label]) => (
          <button key={label} onClick={() => setter(v => !v)} style={{
            background: active ? S.goldBg : S.bgCard,
            border:`1px solid ${active ? S.gold : S.goldBorder}`,
            color: active ? S.goldLight : S.textMuted,
            borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:600,
            cursor:"pointer", display:"flex", alignItems:"center", gap:6,
          }}>
            <span className="hebrew" style={{ fontSize:15 }}>{abbr}</span>
            {label} {active ? "✓" : ""}
          </button>
        ))}
      </div>

      {/* Botões de compartilhar */}
      <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:28 }}>
        <button onClick={handleCopy} style={{
          background: S.bgCard, border:`1px solid ${S.goldBorder}`,
          color: copied ? "#4ade80" : S.textMuted,
          borderRadius:10, padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer",
          display:"flex", alignItems:"center", gap:8,
        }}>
          {copied ? t("copiedBtn") : t("copyBtn")}
        </button>
        <button onClick={handleWhatsApp} style={{
          background:"rgba(37,211,102,0.12)", border:"1px solid rgba(37,211,102,0.3)",
          color:"#25d366", borderRadius:10, padding:"10px 20px", fontSize:13,
          fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8,
        }}>
          {t("whatsappBtn")}
        </button>
        <button onClick={handleShare} style={{
          background: S.goldBg, border:`1px solid ${S.goldBorder}`,
          color:S.goldLight, borderRadius:10, padding:"10px 20px", fontSize:13,
          fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8,
        }}>
          {t("shareBtn")}
        </button>
      </div>

      {/* Todos os versículos */}
      <div>
        <div className="display-font" style={{ color:S.goldLight, fontSize:17, fontWeight:700,
          marginBottom:14, textAlign:"center" }}>
          {t("allVerses")} ({DAILY_VERSES.length})
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:8 }}>
          {DAILY_VERSES.map((v, i) => {
            const isToday = v.ref === verse.ref;
            return (
              <div key={i} style={{
                background: isToday ? S.goldBg : S.bgCard,
                border:`1px solid ${isToday ? S.gold : S.goldBorder}`,
                borderRadius:12, padding:"12px 14px",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                  <span style={{ color: isToday ? S.goldLight : S.gold, fontWeight:700, fontSize:12 }}>{v.ref}</span>
                  {isToday && <span style={{ background:S.gold, color:S.bg, fontSize:9, fontWeight:700,
                    padding:"2px 7px", borderRadius:20 }}>{t("todayBadge")}</span>}
                </div>
                <p style={{ color:S.textMuted, fontSize:12, lineHeight:1.6 }}>"{v.pt}"</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICAÇÃO UTILS ────────────────────────────────────────────────────────

function getNotifBody(key) {
  switch (key) {
    case "shabat": {
      const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
      return `Acendimento das velas em 1 hora — Shabat Shalom! (${days[new Date().getDay()]})`;
    }
    case "feasts": {
      const nxt = getUpcomingFeasts(7)[0];
      return nxt
        ? `${nxt.feast.name} em ${nxt.daysAway} ${nxt.daysAway===1?"dia":"dias"}!`
        : "Nenhuma festa nos próximos 7 dias.";
    }
    case "parasha": {
      const p = getCurrentParasha();
      return p ? `Esta semana: ${p.name} — ${p.ref}` : "Boa leitura da Torá!";
    }
    case "rosh": {
      const rc = getNextRoshChodesh();
      return rc ? `Rosh Chodesh de ${rc.month} — Lua Nova e renovação!` : "Lua Nova — Rosh Chodesh!";
    }
    default: return "Moedim360 — Calendário Bíblico";
  }
}

function fireTestNotif(key, label) {
  const icons = { shabat:"🕯️", feasts:"⭐", parasha:"📖", rosh:"🌙" };
  notifShow(`${icons[key] || "✡"} ${label} — Moedim360`, getNotifBody(key), {
    tag: `moedim-test-${key}`,
  });
}

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────────

function ToggleSwitch({ on, onChange, disabled = false }) {
  const W = 52, H = 30, D = 22, P = 4;
  return (
    <div
      role="switch" aria-checked={on}
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: W, height: H, borderRadius: H,
        background: on
          ? `linear-gradient(135deg,${S.gold},${S.goldLight})`
          : S.isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)",
        border: `1.5px solid ${on ? S.gold : S.goldBorder}`,
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.28s,border 0.28s,box-shadow 0.28s",
        flexShrink: 0,
        boxShadow: on ? `0 0 14px ${S.gold}55` : "none",
        opacity: disabled ? 0.38 : 1,
      }}
    >
      <div style={{
        position: "absolute",
        top: P, left: on ? W - D - P : P,
        width: D, height: D, borderRadius: "50%",
        background: on ? "#0A1B45" : S.isDark ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.9)",
        transition: "left 0.28s cubic-bezier(.4,0,.2,1)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.30)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {on && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke={S.gold} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── NOTIF ITEM DEFINITIONS ───────────────────────────────────────────────────

const NOTIF_DEFS = [
  {
    key: "shabat",
    label: "Shabat",
    heb: "שַׁבָּת",
    iconName: "candle",
    color: "#D4AF37",
    when: "Toda sexta-feira, 1h antes do pôr do sol",
    detail: "Receba um alerta para preparar o coração, a mesa e acender as velas no tempo certo.",
    verse: "Êxodo 20:8 — Lembra do dia do Shabat para santificá-lo.",
  },
  {
    key: "feasts",
    label: "Festas Bíblicas",
    heb: "מוֹעֲדִים360",
    iconName: "star",
    color: "#F2A03D",
    when: "3 dias antes de cada Moed (festa bíblica)",
    detail: "Alertas para Pessach, Shavuot, Rosh Hashaná, Yom Kippur, Sukkot, Chanukah e Purim.",
    verse: "Levítico 23:2 — As festas do Senhor são convocações sagradas.",
  },
  {
    key: "parasha",
    label: "Parashat HaShavua",
    heb: "פָּרָשַׁת הַשָּׁבוּעַ",
    iconName: "scroll",
    color: "#6EA8FE",
    when: "Toda sexta-feira de manhã",
    detail: "O nome, a referência e o tema da porção semanal da Torá antes do Shabat.",
    verse: "Deuteronômio 17:19 — Leia nela todos os dias da sua vida.",
  },
  {
    key: "rosh",
    label: "Rosh Chodesh",
    heb: "רֹאשׁ חֹדֶשׁ",
    iconName: "moon",
    color: "#A78BFA",
    when: "No início de cada mês hebraico (Lua Nova)",
    detail: "Seja alertado no início de cada mês — tempo de renovação espiritual e bênção.",
    verse: "Números 28:11 — No início de cada mês, ofertai ao Senhor.",
  },
];

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────

function SettingsPage({ theme, setTheme, notifPrefs, setNotifPrefs, lang, setLang }) {
  const t = useT(lang);
  const [perm,       setPerm]       = useState("default");
  const [permChecked, setPermChecked] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [feedback,   setFeedback]   = useState({});   // { key: "saved"|"tested" }
  const [saved,      setSaved]      = useState(false);
  const isDark = theme.isDark;

  // Verificar permissão atual (funciona em web e no app nativo Android/iOS)
  useEffect(() => {
    let mounted = true;
    notifGetPermission().then(p => {
      if (mounted) { setPerm(p); setPermChecked(true); }
    });
    return () => { mounted = false; };
  }, []);

  // Persistir prefs
  useEffect(() => {
    try { localStorage.setItem("moedin_notif", JSON.stringify(notifPrefs)); } catch(_) {}
  }, [notifPrefs]);

  // Carregar prefs salvas na primeira vez
  useEffect(() => {
    try {
      const stored = localStorage.getItem("moedin_notif");
      if (stored) setNotifPrefs(JSON.parse(stored));
    } catch(_) {}
  }, []);

  const activeCount = NOTIF_DEFS.filter(d => notifPrefs[d.key]).length;
  const permGranted = perm === "granted";
  const permDenied  = perm === "denied";
  const permPending = perm === "default";

  async function requestPerm() {
    setRequesting(true);
    const p = await notifRequestPermission();
    setPerm(p);
    setRequesting(false);
    if (p === "granted") {
      notifShow(
        "✡ Moedim360 ativado!",
        "Você receberá alertas de Shabat, Festas, Parashah e Rosh Chodesh.",
        { delayMs: 600, tag: "moedin-welcome" }
      );
    }
  }

  function toggle(key) {
    if (!permGranted) return;
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem("moedin_notif", JSON.stringify(next)); } catch(_) {}
      return next;
    });
    setSaved(true);
    setFeedback(f => ({ ...f, [key]: "saved" }));
    setTimeout(() => { setSaved(false); setFeedback(f => ({ ...f, [key]: null })); }, 1800);
  }

  function enableAll() {
    const all = Object.fromEntries(NOTIF_DEFS.map(d => [d.key, true]));
    setNotifPrefs(all);
    try { localStorage.setItem("moedin_notif", JSON.stringify(all)); } catch(_) {}
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }

  function disableAll() {
    const none = Object.fromEntries(NOTIF_DEFS.map(d => [d.key, false]));
    setNotifPrefs(none);
    try { localStorage.setItem("moedin_notif", JSON.stringify(none)); } catch(_) {}
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }

  function testNotif(key, label) {
    fireTestNotif(key, label);
    setFeedback(f => ({ ...f, [key]: "tested" }));
    setTimeout(() => setFeedback(f => ({ ...f, [key]: null })), 2500);
  }

  // ── render ──
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 100px" }}>
      <PageTitle icon="settings" title={t("settingsTitle").replace("⚙️ ","")} sub={t("settingsSub")} />

      {/* ══════════════════════════════════════════════
          BLOCO 1 — APARÊNCIA
      ══════════════════════════════════════════════ */}
      <GlassCard style={{ marginBottom: 16 }}>
        {/* Header do bloco */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background: S.goldBg, border:`1px solid ${S.goldBorder}`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Icon name="sun" size={18} color={S.gold} />
          </div>
          <div>
            <div className="cinzel" style={{ color:S.goldLight, fontWeight:700, fontSize:14, letterSpacing:"0.04em" }}>
              {t("appearance")}
            </div>
            <div style={{ color:S.textMuted, fontSize:11 }}>{t("themePreview")}</div>
          </div>
        </div>

        {/* Seletor de tema */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            {
              t: DARK_THEME, name:t("themeDark"), desc:t("themeDarkDesc"),
              preview: "linear-gradient(135deg,#060F2A,#0A1B45,#162754)",
              active: isDark, accentActive:"#D4AF37",
              stars: true,
            },
            {
              t: LIGHT_THEME, name:t("themeLight"), desc:t("themeLightDesc"),
              preview: "linear-gradient(135deg,#EAE2D4,#F4EFE6,#FFF8EE)",
              active: !isDark, accentActive:"#B8960C",
              stars: false,
            },
          ].map(opt => (
            <button
              key={opt.name}
              onClick={() => { Object.assign(S, opt.t); setTheme(opt.t); }}
              style={{
                background: opt.active
                  ? `${opt.accentActive}16`
                  : S.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                border: `2px solid ${opt.active ? opt.accentActive : S.goldBorder}`,
                borderRadius: 16, padding: 0,
                cursor: "pointer", overflow:"hidden", textAlign:"left",
                transition: "all 0.25s",
                boxShadow: opt.active ? `0 4px 20px ${opt.accentActive}33` : "none",
              }}
            >
              {/* Preview miniatura */}
              <div style={{
                height: 64, background: opt.preview,
                position:"relative", overflow:"hidden",
              }}>
                {/* mini menorah */}
                <div style={{
                  position:"absolute", bottom:6, left:"50%",
                  transform:"translateX(-50%)",
                  fontSize:22, filter:`drop-shadow(0 0 6px ${opt.accentActive}88)`,
                }}>🕎</div>
                {/* mini stars (dark only) */}
                {opt.stars && [20,50,80,35,65].map((x,i)=>(
                  <div key={i} style={{
                    position:"absolute", top:`${(i*17+10)%50}%`, left:`${x}%`,
                    width:2, height:2, borderRadius:"50%", background:"white", opacity:0.5+i*0.1,
                  }}/>
                ))}
                {opt.active && (
                  <div style={{
                    position:"absolute", top:6, right:8,
                    background:opt.accentActive, color:"#0A1B45",
                    fontSize:9, fontWeight:800, padding:"2px 7px",
                    borderRadius:20, letterSpacing:"0.04em",
                  }}>✓ {t("activeTheme")}</div>
                )}
              </div>
              {/* Label */}
              <div style={{ padding:"10px 14px" }}>
                <div style={{
                  fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:13,
                  color: opt.active ? opt.accentActive : S.text, marginBottom:2,
                }}>{opt.name}</div>
                <div style={{ color:S.textMuted, fontSize:11 }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Faixa de preview ao vivo */}
        <div style={{
          marginTop:14, height:6, borderRadius:6, overflow:"hidden",
          background: isDark
            ? "linear-gradient(90deg,#060F2A 0%,#0A1B45 35%,#D4AF37 60%,#F2D16B 80%,#D4AF37 100%)"
            : "linear-gradient(90deg,#EAE2D4 0%,#F4EFE6 35%,#B8960C 60%,#D4A843 80%,#B8960C 100%)",
        }} />
        <div style={{ textAlign:"center", color:S.textMuted, fontSize:11, marginTop:6 }}>
          {isDark ? `🌙 ${t("themeDarkDesc")}` : `☀️ ${t("themeLightDesc")}`}
        </div>
      </GlassCard>

      {/* ══════════════════════════════════════════════
          BLOCO 1b — IDIOMA
      ══════════════════════════════════════════════ */}
      <GlassCard style={{ marginBottom: 16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background: S.goldBg, border:`1px solid ${S.goldBorder}`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
          }}>🌐</div>
          <div>
            <div className="cinzel" style={{ color:S.goldLight, fontWeight:700, fontSize:14, letterSpacing:"0.04em" }}>
              {t("languageSection")}
            </div>
            <div style={{ color:S.textMuted, fontSize:11 }}>
              {LANGUAGES.find(l => l.code===lang)?.nativeName || "Português"}
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px,1fr))", gap:8 }}>
          {LANGUAGES.map(l => {
            const isActive = lang === l.code;
            return (
              <button key={l.code} onClick={() => setLang(l.code)} style={{
                background: isActive ? S.goldBg : S.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                border:`2px solid ${isActive ? S.gold : S.goldBorder}`,
                borderRadius:14, padding:"12px 10px",
                cursor:"pointer", textAlign:"center", transition:"all 0.2s",
                boxShadow: isActive ? `0 4px 16px ${S.gold}33` : "none",
              }}>
                <div style={{ fontSize:26, marginBottom:6 }}>{l.flag}</div>
                <div style={{
                  fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:12,
                  color: isActive ? S.goldLight : S.text, marginBottom:2,
                }}>{l.nativeName}</div>
                {isActive && (
                  <div style={{
                    background:S.gold, color:"#0A1B45",
                    fontSize:9, fontWeight:800, padding:"1px 6px",
                    borderRadius:20, display:"inline-block", letterSpacing:"0.04em",
                  }}>✓</div>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* ══════════════════════════════════════════════
          BLOCO 2 — NOTIFICAÇÕES
      ══════════════════════════════════════════════ */}
      <GlassCard style={{ marginBottom: 16 }}>
        {/* Header do bloco */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:10, marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background: S.goldBg, border:`1px solid ${S.goldBorder}`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Icon name="bell" size={18} color={S.gold} />
            </div>
            <div>
              <div className="cinzel" style={{ color:S.goldLight, fontWeight:700, fontSize:14, letterSpacing:"0.04em" }}>
                {t("notifications")}
              </div>
              <div style={{ color:S.textMuted, fontSize:11 }}>
                {permGranted ? `${activeCount}/${NOTIF_DEFS.length}` : t("notifStatusAsk")}
              </div>
            </div>
          </div>
          {saved && (
            <span style={{
              background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)",
              color:"#34d399", fontSize:11, fontWeight:700,
              padding:"4px 12px", borderRadius:20, display:"flex", alignItems:"center", gap:5,
            }}>
              <Icon name="check" size={12} color="#34d399" strokeWidth={2.5} /> {t("savedBadge")}
            </span>
          )}
        </div>

        {/* ── Banner de permissão ── */}
        <div style={{
          borderRadius:14, padding:"14px 16px", marginBottom:18,
          background: permGranted
            ? "rgba(52,211,153,0.07)"
            : permDenied ? "rgba(248,113,113,0.07)"
            : "rgba(212,175,55,0.08)",
          border:`1.5px solid ${
            permGranted ? "rgba(52,211,153,0.30)"
            : permDenied ? "rgba(248,113,113,0.30)"
            : S.goldBorder}`,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
            {/* ícone de estado */}
            <div style={{
              width:44, height:44, borderRadius:12, flexShrink:0,
              background: permGranted
                ? "rgba(52,211,153,0.12)"
                : permDenied ? "rgba(248,113,113,0.12)"
                : S.goldBg,
              border:`1px solid ${
                permGranted ? "rgba(52,211,153,0.30)"
                : permDenied ? "rgba(248,113,113,0.30)"
                : S.goldBorder}`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Icon
                name="bell"
                size={20}
                color={permGranted ? "#34d399" : permDenied ? "#f87171" : S.gold}
              />
            </div>
            <div style={{ flex:1 }}>
              <div style={{
                fontWeight:700, fontSize:13,
                color: permGranted ? "#34d399" : permDenied ? "#f87171" : S.goldLight,
                marginBottom:3,
              }}>
                {permGranted ? t("notifStatusOn")
                  : permDenied ? t("notifStatusOff")
                  : t("notifStatusAsk")}
              </div>
              <div style={{ color:S.textMuted, fontSize:12, lineHeight:1.5 }}>
                {permGranted
                  ? t("notifStatusOnDesc")
                  : permDenied
                  ? t("notifStatusOffDesc")
                  : t("notifStatusAskDesc")}
              </div>
            </div>
            {permPending && (
              <PButton onClick={requestPerm} disabled={requesting} icon="bell">
                {requesting ? t("pleaseWait") : t("activate")}
              </PButton>
            )}
          </div>

          {/* Barra de progresso quando ativo */}
          {permGranted && (
            <div style={{ marginTop:12 }}>
              <div style={{
                display:"flex", justifyContent:"space-between",
                fontSize:10, color:S.textMuted, marginBottom:5,
              }}>
                <span>{t("typesEnabled")}</span>
                <span>{activeCount}/{NOTIF_DEFS.length}</span>
              </div>
              <div style={{ height:5, borderRadius:5, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:5,
                  width:`${(activeCount/NOTIF_DEFS.length)*100}%`,
                  background:`linear-gradient(90deg,${S.gold},${S.goldLight})`,
                  transition:"width 0.4s cubic-bezier(.22,1,.36,1)",
                }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Cards individuais de notificação ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {NOTIF_DEFS.map(item => {
            const isOn   = !!(notifPrefs[item.key]);
            const fb     = feedback[item.key];
            const canAct = permGranted;

            return (
              <div key={item.key} className="fade-up" style={{
                borderRadius:16, overflow:"hidden",
                border:`1.5px solid ${isOn && canAct ? item.color+"44" : S.divider}`,
                background: isOn && canAct
                  ? `${item.color}09`
                  : S.isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)",
                transition:"all 0.25s ease",
              }}>
                {/* ── linha principal (clicável) ── */}
                <div
                  style={{
                    display:"flex", alignItems:"center",
                    gap:14, padding:"14px 16px",
                    cursor: canAct ? "pointer" : "default",
                  }}
                  onClick={() => toggle(item.key)}
                >
                  {/* Ícone colorido */}
                  <div style={{
                    width:46, height:46, borderRadius:13, flexShrink:0,
                    background: isOn && canAct ? `${item.color}18` : "rgba(255,255,255,0.04)",
                    border:`1.5px solid ${isOn && canAct ? item.color+"44" : S.divider}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.25s",
                    boxShadow: isOn && canAct ? `0 4px 14px ${item.color}33` : "none",
                  }}>
                    <Icon
                      name={item.iconName}
                      size={20}
                      color={isOn && canAct ? item.color : S.textMuted}
                      strokeWidth={isOn ? 1.8 : 1.5}
                    />
                  </div>

                  {/* Texto */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:2 }}>
                      <span style={{
                        fontWeight:700, fontSize:14, letterSpacing:"0.01em",
                        color: isOn && canAct ? S.text : S.textSub,
                        transition:"color 0.2s",
                      }}>{t(`notif_${item.key}_label`)}</span>
                      <span className="hebrew" style={{
                        fontSize:15,
                        color: isOn && canAct ? item.color : S.textMuted,
                        opacity: isOn ? 1 : 0.5,
                        transition:"all 0.2s",
                      }}>{item.heb}</span>
                      {fb === "saved" && (
                        <span style={{
                          background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)",
                          color:"#34d399", fontSize:9, fontWeight:700,
                          padding:"1px 7px", borderRadius:20,
                        }}>{t("savedBadge")} ✓</span>
                      )}
                    </div>
                    <div style={{ color:S.textMuted, fontSize:11, lineHeight:1.4 }}>{t(`notif_${item.key}_when`)}</div>
                  </div>

                  {/* Toggle */}
                  <ToggleSwitch
                    on={isOn && canAct}
                    onChange={() => toggle(item.key)}
                    disabled={!canAct}
                  />
                </div>

                {/* ── Detalhe expandido quando ON ── */}
                {isOn && canAct && (
                  <div className="slide-down" style={{
                    borderTop:`1px solid ${item.color}22`,
                    background:`${item.color}05`,
                    padding:"12px 16px 14px",
                  }}>
                    <p style={{ color:S.textSub, fontSize:12, lineHeight:1.65, marginBottom:10 }}>
                      {t(`notif_${item.key}_detail`)}
                    </p>
                    <div style={{
                      display:"flex", justifyContent:"space-between",
                      alignItems:"center", flexWrap:"wrap", gap:8,
                    }}>
                      <div style={{
                        color:`${item.color}cc`, fontSize:11, fontStyle:"italic",
                        display:"flex", alignItems:"center", gap:5,
                      }}>
                        <Icon name="scroll" size={12} color={`${item.color}99`} />
                        {t(`notif_${item.key}_verse`)}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); testNotif(item.key, t(`notif_${item.key}_label`)); }}
                        style={{
                          background: fb === "tested"
                            ? "rgba(52,211,153,0.12)"
                            : `${item.color}14`,
                          border:`1px solid ${fb === "tested" ? "rgba(52,211,153,0.35)" : item.color+"33"}`,
                          color: fb === "tested" ? "#34d399" : item.color,
                          borderRadius:8, padding:"5px 13px", fontSize:11,
                          fontWeight:700, cursor:"pointer",
                          display:"flex", alignItems:"center", gap:6,
                          transition:"all 0.2s",
                        }}
                      >
                        {fb === "tested"
                          ? <><Icon name="check" size={11} color="#34d399" strokeWidth={2.5}/>{t("sentBadge")}</>
                          : <><Icon name="bell" size={11} color={item.color}/>{t("testNowBtn")}</>
                        }
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Hint quando desabilitado ── */}
                {!canAct && (
                  <div style={{
                    padding:"6px 16px 10px",
                    borderTop:`1px solid ${S.divider}`,
                    color:S.textMuted, fontSize:11,
                    display:"flex", alignItems:"center", gap:6,
                  }}>
                    <Icon name="bell" size={12} color={S.textMuted} />
                    {permDenied
                      ? t("blockedHint")
                      : t("enableAboveHint")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Ativar / Desativar todas ── */}
        {permGranted && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16 }}>
            <PButton variant="ghost" icon="bell" onClick={enableAll} fullWidth>
              {t("enableAllBtn")}
            </PButton>
            <PButton variant="danger" onClick={disableAll} fullWidth>
              {t("disableAllBtn")}
            </PButton>
          </div>
        )}
      </GlassCard>

      {/* ══════════════════════════════════════════════
          BLOCO 3 — SOBRE O APP
      ══════════════════════════════════════════════ */}
      <GlassCard>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
          <MenorahLogo size={48} glow />
          <div>
            <div className="cinzel" style={{ color:S.goldLight, fontWeight:700, fontSize:15 }}>
              Moedim360 — Calendário Bíblico
            </div>
            <div className="hebrew" style={{ color:S.gold, fontSize:18 }}>מוֹעֲדִים360</div>
            <div style={{ color:S.textMuted, fontSize:11 }}>{t("encountersEternal")}</div>
          </div>
        </div>

        <GoldDivider my={12} />

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { icon:"calendar", label:t("nav_calendar"), desc:t("featCalendar") },
            { icon:"convert",  label:t("nav_converter"),  desc:t("featConverter") },
            { icon:"scroll",   label:t("nav_parasha"),   desc:t("featParashah") },
            { icon:"candle",   label:t("nav_shabat"),     desc:t("featShabat") },
            { icon:"star",     label:t("nav_feasts"),     desc:t("featFeasts") },
            { icon:"moon",     label:t("nav_moon"),desc:t("featRosh") },
            { icon:"book",     label:t("nav_verse"),  desc:t("featVerse") },
            { icon:"settings", label:t("nav_settings"),desc:t("featSettings") },
          ].map(f => (
            <div key={f.label} style={{
              background: S.isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.03)",
              borderRadius:12, padding:"10px 12px",
              border:`1px solid ${S.divider}`,
              display:"flex", alignItems:"center", gap:10,
            }}>
              <Icon name={f.icon} size={16} color={S.gold} />
              <div>
                <div style={{ color:S.text, fontWeight:600, fontSize:12 }}>{f.label}</div>
                <div style={{ color:S.textMuted, fontSize:10 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", color:S.textMuted, fontSize:11, lineHeight:1.7 }}>
          Ano 5786 • Hebcal • Sefer Yetzirah • Arizal
          <br/>
          <span className="hebrew" style={{ color:S.gold, fontSize:15 }}>שַׁבָּת שָׁלוֹם וּמְבֹרָךְ</span>
        </div>
      </GlassCard>
    </div>
  );
}


// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab,   setActiveTab]   = useState("calendar");
  const [theme,       setTheme]       = useState(DARK_THEME);
  const [lang,        setLang]        = useState(() => {
    try { return localStorage.getItem("moedin_lang") || "pt"; } catch(_) { return "pt"; }
  });
  const [notifPrefs,  setNotifPrefs]  = useState({
    shabat: true, feasts: true, parasha: true, rosh: false, verse: false,
  });

  // Keep S proxy in sync with chosen theme
  useEffect(() => { Object.assign(S, theme); }, [theme]);

  // Persist language
  useEffect(() => {
    try { localStorage.setItem("moedin_lang", lang); } catch(_) {}
  }, [lang]);

  const pages = {
    calendar:    <CalendarPage    lang={lang} />,
    converter:   <ConverterPage   lang={lang} />,
    parasha:     <ParashaPage     lang={lang} />,
    shabat:      <ShabatPage      lang={lang} />,
    feasts:      <FeastsPage      lang={lang} />,
    roshchodesh: <RoshChodeshPage lang={lang} />,
    verse:       <VersePage       lang={lang} />,
    learn:       <LearnPage       lang={lang} />,
    settings:    <SettingsPage    lang={lang} setLang={setLang}
                   theme={theme} setTheme={(t) => { Object.assign(S, t); setTheme(t); }}
                   notifPrefs={notifPrefs} setNotifPrefs={setNotifPrefs} />,
  };

  return (
    <>
      <style>{buildCSS(theme)}</style>

      <Navigation active={activeTab} setActive={setActiveTab} lang={lang} setLang={setLang} />

      {/* Notification manager */}
      <div style={{ maxWidth: 960, margin: "12px auto 0", padding: "0 16px" }}>
        <NotificationManager lang={lang} />
      </div>

      {/* Page content */}
      <main style={{ minHeight: "70vh" }}>
        {pages[activeTab]}
      </main>

      <InstallBanner lang={lang} />

      {/* Premium Footer */}
      <footer style={{
        textAlign: "center", padding: "32px 16px 90px",
        borderTop: `1px solid ${S.navBorder}`,
        background: S.isDark
          ? "linear-gradient(180deg, transparent, rgba(6,15,42,0.8))"
          : "linear-gradient(180deg, transparent, rgba(234,226,212,0.5))",
      }}>
        {/* gold divider */}
        <div style={{ display:"flex", alignItems:"center", gap:12, maxWidth:300, margin:"0 auto 20px" }}>
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg, transparent, ${S.goldBorder})` }}/>
          <MenorahLogo size={48} glow={false} />
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${S.goldBorder}, transparent)` }}/>
        </div>
        <div className="hebrew" style={{ color:S.gold, fontSize:17, marginBottom:6, opacity:0.9 }}>
          שַׁבָּת שָׁלוֹם
        </div>
        <div className="cinzel" style={{ color:S.textMuted, fontSize:11, letterSpacing:"0.08em" }}>
          MOEDIM — CALENDÁRIO BÍBLICO • מוֹעֲדִים360
        </div>
        <div style={{ color:S.textMuted, fontSize:10, marginTop:4, fontFamily:"'Inter',sans-serif" }}>
          Encontros Marcados pelo Eterno
        </div>
      </footer>
    </>
  );
}
