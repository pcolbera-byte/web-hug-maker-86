import { useState, useEffect, useMemo, useCallback } from "react";
import moedimLogoAsset from "../assets/moedim-logo.png.asset.json";


// ─── HEBREW CALENDAR DATA ────────────────────────────────────────────────────

const HEBREW_MONTHS = [
  { id: 1, name: "Nissan", heb: "נִיסָן", approx: "Mar-Abr", desc: "Mês da redenção" },
  { id: 2, name: "Iyar", heb: "אִיָּר", approx: "Abr-Mai", desc: "Mês da cura" },
  { id: 3, name: "Sivan", heb: "סִיוָן", approx: "Mai-Jun", desc: "Mês da revelação" },
  { id: 4, name: "Tammuz", heb: "תַּמּוּז", approx: "Jun-Jul", desc: "Mês da visão" },
  { id: 5, name: "Av", heb: "אָב", approx: "Jul-Ago", desc: "Mês da consolação" },
  { id: 6, name: "Elul", heb: "אֱלוּל", approx: "Ago-Set", desc: "Mês do arrependimento" },
  { id: 7, name: "Tishrei", heb: "תִּשְׁרֵי", approx: "Set-Out", desc: "Mês das festas" },
  { id: 8, name: "Cheshvan", heb: "חֶשְׁוָן", approx: "Out-Nov", desc: "Mês da chuva" },
  { id: 9, name: "Kislev", heb: "כִּסְלֵו", approx: "Nov-Dez", desc: "Mês da luz" },
  { id: 10, name: "Tevet", heb: "טֵבֵת", approx: "Dez-Jan", desc: "Mês da ira santa" },
  { id: 11, name: "Shevat", heb: "שְׁבָט", approx: "Jan-Fev", desc: "Mês da renovação" },
  { id: 12, name: "Adar", heb: "אֲדָר", approx: "Fev-Mar", desc: "Mês da alegria" },
  { id: 13, name: "Adar II", heb: "אֲדָר ב׳", approx: "Mar-Abr", desc: "Segundo Adar" },
];

const BIBLICAL_FEASTS = [
  { name: "Pessach", heb: "פֶּסַח", date: "15 Nissan", month: 1, day: 15, dur: 7, cat: "spring", emoji: "🐑",
    desc: "Celebra a libertação do povo de Israel da escravidão no Egito.",
    sig: "Yeshua é o Cordeiro Pascal sacrificado por nós. A última ceia foi um Seder de Pessach.",
    scripture: "Êxodo 12:1-14; 1 Coríntios 5:7" },
  { name: "Pães Ázimos", heb: "חַג הַמַּצּוֹת", date: "15-21 Nissan", month: 1, day: 15, dur: 7, cat: "spring", emoji: "🫓",
    desc: "Sete dias comendo pão sem fermento, lembrando a pressa da saída do Egito.",
    sig: "O fermento representa o pecado. Yeshua é o Pão da Vida sem pecado.",
    scripture: "Levítico 23:6-8; João 6:35" },
  { name: "Primícias", heb: "יוֹם הַבִּכּוּרִים", date: "16 Nissan", month: 1, day: 16, dur: 1, cat: "spring", emoji: "🌾",
    desc: "Oferenda dos primeiros frutos da colheita da cevada.",
    sig: "Yeshua ressuscitou neste dia, sendo as primícias dos que dormem.",
    scripture: "Levítico 23:9-14; 1 Coríntios 15:20-23" },
  { name: "Shavuot", heb: "שָׁבוּעוֹת", date: "6 Sivan", month: 3, day: 6, dur: 2, cat: "spring", emoji: "🔥",
    desc: "Festa das Semanas, 50 dias após Pessach. Celebra a entrega da Torá no Sinai.",
    sig: "O Espírito Santo foi derramado em Shavuot (Atos 2). A Lei escrita no coração.",
    scripture: "Levítico 23:15-21; Atos 2:1-4" },
  { name: "Yom Teruah", heb: "יוֹם תְּרוּעָה", date: "1 Tishrei", month: 7, day: 1, dur: 2, cat: "fall", emoji: "🎺",
    desc: "Dia do Toque do Shofar. Marca o início do ano civil judaico.",
    sig: "Simboliza o retorno do Messias com som de trombeta.",
    scripture: "Levítico 23:23-25; 1 Tessalonicenses 4:16-17" },
  { name: "Yom Kippur", heb: "יוֹם כִּפּוּר", date: "10 Tishrei", month: 7, day: 10, dur: 1, cat: "fall", emoji: "✨",
    desc: "O dia mais sagrado do ano. Dia de jejum, arrependimento e expiação.",
    sig: "Yeshua é nosso Sumo Sacerdote que entrou no Santo dos Santos com Seu próprio sangue.",
    scripture: "Levítico 23:26-32; Hebreus 9:11-12" },
  { name: "Sukkot", heb: "סוּכּוֹת", date: "15 Tishrei", month: 7, day: 15, dur: 7, cat: "fall", emoji: "🌿",
    desc: "Festa das Cabanas. Sete dias lembrando a peregrinação no deserto.",
    sig: "Deus tabernaculou entre nós em Yeshua (João 1:14).",
    scripture: "Levítico 23:33-43; João 1:14; 7:37-38" },
  { name: "Shemini Atzeret", heb: "שְׁמִינִי עֲצֶרֶת", date: "22 Tishrei", month: 7, day: 22, dur: 1, cat: "fall", emoji: "🕊️",
    desc: "O Oitavo Dia de Assembleia. Conclusão festiva de Sukkot.",
    sig: "Representa a eternidade com Deus, o \"oitavo dia\" além do ciclo de sete.",
    scripture: "Levítico 23:36; Números 29:35" },
  { name: "Chanukah", heb: "חֲנוּכָּה", date: "25 Kislev", month: 9, day: 25, dur: 8, cat: "other", emoji: "🕎",
    desc: "Festa das Luzes. Celebra a rededicação do Templo.",
    sig: "Yeshua é a Luz do Mundo. Ele celebrou Chanukah (João 10:22-23).",
    scripture: "João 10:22-23; Daniel 8:9-14" },
  { name: "Purim", heb: "פּוּרִים", date: "14 Adar", month: 12, day: 14, dur: 2, cat: "other", emoji: "🎭",
    desc: "Celebra a salvação dos judeus na Pérsia através da rainha Ester.",
    sig: "Demonstra a providência divina e proteção do povo de Deus.",
    scripture: "Ester 9:20-28" },
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
    theme: "A criação do mundo e da humanidade",
    dataDiaspora: "2025-10-18", dataIsrael: null,
    hebrewDate: "26 Tishrei 5786", book: "Bereshit",
  },
  {
    num: 2, name: "Noach", heb: "נֹחַ", ref: "Gn 6:9–11:32",
    haftara: "Isaías 54:1-10",
    theme: "O dilúvio, a arca e a aliança do arco-íris",
    dataDiaspora: "2025-10-25", dataIsrael: null,
    hebrewDate: "3 Cheshvan 5786", book: "Bereshit",
  },
  {
    num: 3, name: "Lech Lecha", heb: "לֶךְ-לְךָ", ref: "Gn 12:1–17:27",
    haftara: "Isaías 40:27–41:16",
    theme: "A chamada de Avraham e a aliança da circuncisão",
    dataDiaspora: "2025-11-01", dataIsrael: null,
    hebrewDate: "10 Cheshvan 5786", book: "Bereshit",
  },
  {
    num: 4, name: "Vayera", heb: "וַיֵּרָא", ref: "Gn 18:1–22:24",
    haftara: "2 Reis 4:1-37",
    theme: "Os três visitantes, Sodoma e a provação de Avraham",
    dataDiaspora: "2025-11-08", dataIsrael: null,
    hebrewDate: "17 Cheshvan 5786", book: "Bereshit",
  },
  {
    num: 5, name: "Chayei Sarah", heb: "חַיֵּי שָׂרָה", ref: "Gn 23:1–25:18",
    haftara: "1 Reis 1:1-31",
    theme: "A morte de Sara e o casamento de Yitzchak com Rivka",
    dataDiaspora: "2025-11-15", dataIsrael: null,
    hebrewDate: "24 Cheshvan 5786", book: "Bereshit",
  },
  {
    num: 6, name: "Toldot", heb: "תּוֹלְדֹת", ref: "Gn 25:19–28:9",
    haftara: "Malaquias 1:1–2:7",
    theme: "Esav e Yaakov — as duas nações no ventre de Rivka",
    dataDiaspora: "2025-11-22", dataIsrael: null,
    hebrewDate: "2 Kislev 5786", book: "Bereshit",
  },
  {
    num: 7, name: "Vayetze", heb: "וַיֵּצֵא", ref: "Gn 28:10–32:3",
    haftara: "Oséias 11:7–12:14",
    theme: "A escada de Yaakov, Laban e o nascimento das tribos",
    dataDiaspora: "2025-11-29", dataIsrael: null,
    hebrewDate: "9 Kislev 5786", book: "Bereshit",
  },
  {
    num: 8, name: "Vayishlach", heb: "וַיִּשְׁלַח", ref: "Gn 32:4–36:43",
    haftara: "Obadias 1:1-21",
    theme: "Yaakov luta com o anjo, se reconcilia com Esav e recebe o nome Israel",
    dataDiaspora: "2025-12-06", dataIsrael: null,
    hebrewDate: "16 Kislev 5786", book: "Bereshit",
  },
  {
    num: 9, name: "Vayeshev", heb: "וַיֵּשֶׁב", ref: "Gn 37:1–40:23",
    haftara: "Amós 2:6–3:8",
    theme: "Yosef é vendido pelos irmãos e interpreta sonhos na prisão",
    dataDiaspora: "2025-12-13", dataIsrael: null,
    hebrewDate: "23 Kislev 5786", book: "Bereshit",
  },
  {
    num: 10, name: "Miketz", heb: "מִקֵּץ", ref: "Gn 41:1–44:17",
    haftara: "Zacarias 2:14–4:7",
    theme: "Yosef interpreta os sonhos do Faraó e se torna governador do Egito",
    dataDiaspora: "2025-12-20", dataIsrael: null,
    hebrewDate: "30 Kislev 5786", book: "Bereshit",
    nota: "Shabat de Chanukah — leitura adicional de Números 7",
  },
  {
    num: 11, name: "Vayigash", heb: "וַיִּגַּשׁ", ref: "Gn 44:18–47:27",
    haftara: "Ezequiel 37:15-28",
    theme: "Yosef se revela aos irmãos; Yaakov desce ao Egito",
    dataDiaspora: "2025-12-27", dataIsrael: null,
    hebrewDate: "7 Tevet 5786", book: "Bereshit",
  },
  {
    num: 12, name: "Vayechi", heb: "וַיְחִי", ref: "Gn 47:28–50:26",
    haftara: "1 Reis 2:1-12",
    theme: "As bênçãos finais de Yaakov às doze tribos e sua morte",
    dataDiaspora: "2026-01-03", dataIsrael: null,
    hebrewDate: "14 Tevet 5786", book: "Bereshit",
  },
  // ── SHEMOT / Êxodo ──
  {
    num: 13, name: "Shemot", heb: "שְׁמוֹת", ref: "Êx 1:1–6:1",
    haftara: "Isaías 27:6–28:13; 29:22-23",
    theme: "O nascimento de Moshe, a sarça ardente e o chamado de Deus",
    dataDiaspora: "2026-01-10", dataIsrael: null,
    hebrewDate: "21 Tevet 5786", book: "Shemot",
  },
  {
    num: 14, name: "Va'era", heb: "וָאֵרָא", ref: "Êx 6:2–9:35",
    haftara: "Ezequiel 28:25–29:21",
    theme: "Deus revela Seu nome e envia as primeiras sete pragas ao Egito",
    dataDiaspora: "2026-01-17", dataIsrael: null,
    hebrewDate: "28 Tevet 5786", book: "Shemot",
  },
  {
    num: 15, name: "Bo", heb: "בֹּא", ref: "Êx 10:1–13:16",
    haftara: "Jeremias 46:13-28",
    theme: "As últimas três pragas, o Pessach e a saída do Egito",
    dataDiaspora: "2026-01-24", dataIsrael: null,
    hebrewDate: "6 Shevat 5786", book: "Shemot",
  },
  {
    num: 16, name: "Beshalach", heb: "בְּשַׁלַּח", ref: "Êx 13:17–17:16",
    haftara: "Juízes 4:4–5:31",
    theme: "A travessia do Mar Vermelho e o Cântico de Moshe",
    dataDiaspora: "2026-01-31", dataIsrael: null,
    hebrewDate: "13 Shevat 5786", book: "Shemot",
    nota: "Shabat Shirah — Shabat do Cântico",
  },
  {
    num: 17, name: "Yitro", heb: "יִתְרוֹ", ref: "Êx 18:1–20:23",
    haftara: "Isaías 6:1-13",
    theme: "Yitro visita Moshe; Os Dez Mandamentos são dados no Monte Sinai",
    dataDiaspora: "2026-02-07", dataIsrael: null,
    hebrewDate: "20 Shevat 5786", book: "Shemot",
  },
  {
    num: 18, name: "Mishpatim", heb: "מִשְׁפָּטִים", ref: "Êx 21:1–24:18",
    haftara: "2 Reis 11:17–12:17",
    theme: "As leis civis e sociais da aliança no Sinai",
    dataDiaspora: "2026-02-14", dataIsrael: null,
    hebrewDate: "27 Shevat 5786", book: "Shemot",
    nota: "Shabat Shekalim — leitura adicional de Êxodo 30:11-16",
  },
  {
    num: 19, name: "Terumah", heb: "תְּרוּמָה", ref: "Êx 25:1–27:19",
    haftara: "1 Reis 5:26–6:13",
    theme: "As instruções detalhadas para a construção do Mishkan (Tabernáculo)",
    dataDiaspora: "2026-02-21", dataIsrael: null,
    hebrewDate: "4 Adar 5786", book: "Shemot",
  },
  {
    num: 20, name: "Tetzaveh", heb: "תְּצַוֶּה", ref: "Êx 27:20–30:10",
    haftara: "1 Samuel 15:1-34",
    theme: "As vestes sagradas dos sacerdotes e a consagração de Aharon",
    dataDiaspora: "2026-02-28", dataIsrael: null,
    hebrewDate: "11 Adar 5786", book: "Shemot",
    nota: "Shabat Zachor — leitura adicional de Dt 25:17-19",
  },
  {
    num: 21, name: "Ki Tisa", heb: "כִּי תִשָּׂא", ref: "Êx 30:11–34:35",
    haftara: "Ezequiel 36:16-36",
    theme: "O Censo, o Shabat, o Bezerro de Ouro e a renovação da aliança",
    dataDiaspora: "2026-03-07", dataIsrael: null,
    hebrewDate: "18 Adar 5786", book: "Shemot",
    nota: "Shabat Parah — leitura adicional de Números 19:1-22",
  },
  {
    num: 22, name: "Vayakhel-Pekudei", heb: "וַיַּקְהֵל-פְּקוּדֵי", ref: "Êx 35:1–40:38",
    haftara: "2 Reis 11:17–12:17 + 1 Reis 7:51–8:21",
    theme: "A construção, conclusão e dedicação do Mishkan",
    dataDiaspora: "2026-03-14", dataIsrael: null,
    hebrewDate: "25 Adar 5786", book: "Shemot",
    double: true, nota: "Porção dupla",
  },
  // ── VAYIKRA / Levítico ──
  {
    num: 24, name: "Vayikra", heb: "וַיִּקְרָא", ref: "Lv 1:1–5:26",
    haftara: "Isaías 43:21–44:23",
    theme: "Deus chama Moshe e instrui sobre os sacrifícios e ofrendas",
    dataDiaspora: "2026-03-21", dataIsrael: null,
    hebrewDate: "3 Nissan 5786", book: "Vayikra",
    nota: "Shabat HaGadol — Haftará: Malaquias 3:4-24",
  },
  {
    num: 25, name: "Tzav", heb: "צַו", ref: "Lv 6:1–8:36",
    haftara: "Jeremias 7:21–8:3; 9:22-23",
    theme: "Leis dos sacerdotes, o fogo perpétuo e a consagração de Aharon",
    dataDiaspora: "2026-03-28", dataIsrael: null,
    hebrewDate: "10 Nissan 5786", book: "Vayikra",
  },
  {
    num: 26, name: "Shemini", heb: "שְּׁמִינִי", ref: "Lv 9:1–11:47",
    haftara: "2 Samuel 6:1–7:17",
    theme: "A inauguração do Tabernáculo, a morte de Nadav e Avihu, as leis alimentares",
    dataDiaspora: "2026-04-11", dataIsrael: null,
    hebrewDate: "24 Nissan 5786", book: "Vayikra",
    nota: "Após Pessach — semana de Pessach interrompe o ciclo",
  },
  {
    num: 27, name: "Tazria-Metzora", heb: "תַזְרִיעַ-מְּצֹרָע", ref: "Lv 12:1–15:33",
    haftara: "2 Reis 4:42–5:19 + 2 Reis 7:3-20",
    theme: "Leis de pureza após o parto, tsaraat (lepra) e sua purificação",
    dataDiaspora: "2026-04-18", dataIsrael: null,
    hebrewDate: "1 Iyar 5786", book: "Vayikra",
    double: true, nota: "Porção dupla",
  },
  {
    num: 29, name: "Acharei Mot-Kedoshim", heb: "אַחֲרֵי מוֹת-קְדֹשִׁים", ref: "Lv 16:1–20:27",
    haftara: "Ezequiel 22:1-16 + Amós 9:7-15",
    theme: "O serviço de Yom Kippur e a lei da santidade: \"Sede santos!\"",
    dataDiaspora: "2026-04-25", dataIsrael: null,
    hebrewDate: "8 Iyar 5786", book: "Vayikra",
    double: true, nota: "Porção dupla",
  },
  {
    num: 31, name: "Emor", heb: "אֱמֹר", ref: "Lv 21:1–24:23",
    haftara: "Ezequiel 44:15-31",
    theme: "Leis dos sacerdotes e as festas do Senhor (Moadim)",
    dataDiaspora: "2026-05-02", dataIsrael: null,
    hebrewDate: "15 Iyar 5786", book: "Vayikra",
  },
  {
    num: 32, name: "Behar-Bechukotai", heb: "בְּהַר-בְּחֻקֹּתַי", ref: "Lv 25:1–27:34",
    haftara: "Jeremias 32:6-27 + Jeremias 16:19–17:14",
    theme: "O Shemitá, o Jubileu e as bênçãos e maldições da aliança",
    dataDiaspora: "2026-05-09", dataIsrael: null,
    hebrewDate: "22 Iyar 5786", book: "Vayikra",
    double: true, nota: "Porção dupla",
  },
  // ── BAMIDBAR / Números ──
  {
    num: 34, name: "Bamidbar", heb: "בְּמִדְבַּר", ref: "Nm 1:1–4:20",
    haftara: "Oséias 2:1-22",
    theme: "O censo das doze tribos no deserto do Sinai",
    dataDiaspora: "2026-05-16", dataIsrael: null,
    hebrewDate: "29 Iyar 5786", book: "Bamidbar",
    nota: "Antes de Shavuot",
  },
  {
    num: 35, name: "Nasso", heb: "נָשֹׂא", ref: "Nm 4:21–7:89",
    haftara: "Juízes 13:2-25",
    theme: "Deveres dos Levitas, a lei da Sotá, o Nazireu e a bênção sacerdotal",
    dataDiaspora: "2026-05-30", dataIsrael: null,
    hebrewDate: "14 Sivan 5786", book: "Bamidbar",
    nota: "Após Shavuot — a festa interrompe o ciclo",
  },
  {
    num: 36, name: "Beha'alotcha", heb: "בְּהַעֲלֹתְךָ", ref: "Nm 8:1–12:16",
    haftara: "Zacarias 2:14–4:7",
    theme: "A Menorá, a partida do Sinai, as codornizes e a lepra de Miriam",
    dataDiaspora: "2026-06-06", dataIsrael: null,
    hebrewDate: "21 Sivan 5786", book: "Bamidbar",
  },
  {
    num: 37, name: "Shelach", heb: "שְׁלַח", ref: "Nm 13:1–15:41",
    haftara: "Josué 2:1-24",
    theme: "Os doze espias, o relatório negativo e 40 anos no deserto",
    dataDiaspora: "2026-06-13", dataIsrael: null,
    hebrewDate: "28 Sivan 5786", book: "Bamidbar",
  },
  {
    // Diáspora: Korach sozinho em 20/06 | Israel: Korach em 13/06
    num: 38, name: "Korach", heb: "קֹרַח", ref: "Nm 16:1–18:32",
    haftara: "1 Samuel 11:14–12:22",
    theme: "A rebelião de Korach e dos 250 líderes contra Moshe e Aharon",
    dataDiaspora: "2026-06-20", dataIsrael: "2026-06-13",
    hebrewDate: "5 Tamuz 5786", book: "Bamidbar",
    diffIsrael: true,
  },
  {
    // Diáspora: Chukat-Balak juntos em 27/06 | Israel: Chukat em 20/06, Balak em 27/06
    num: 39, name: "Chukat-Balak", heb: "חֻקַּת-בָּלָק", ref: "Nm 19:1–25:9",
    haftara: "Juízes 11:1-33 + Miquéias 5:6–6:8",
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
    theme: "O zelo de Pinchas, novo censo e as festas do calendário sagrado",
    dataDiaspora: "2026-07-04", dataIsrael: null,
    hebrewDate: "19 Tamuz 5786", book: "Bamidbar",
  },
  {
    num: 42, name: "Matot-Masei", heb: "מַּטּוֹת-מַסְעֵי", ref: "Nm 30:2–36:13",
    haftara: "Jeremias 1:1–2:3 + Jeremias 2:4–28; 3:4",
    theme: "Os votos, as guerras e as 42 etapas da jornada no deserto",
    dataDiaspora: "2026-07-11", dataIsrael: null,
    hebrewDate: "26 Tamuz 5786", book: "Bamidbar",
    double: true, nota: "Porção dupla",
  },
  // ── DEVARIM / Deuteronômio ──
  {
    num: 44, name: "Devarim", heb: "דְּבָרִים", ref: "Dt 1:1–3:22",
    haftara: "Isaías 1:1-27",
    theme: "O discurso final de Moshe começa — revisão da história de Israel",
    dataDiaspora: "2026-07-18", dataIsrael: null,
    hebrewDate: "4 Av 5786", book: "Devarim",
    nota: "Shabat Chazon — véspera de Tisha B'Av",
  },
  {
    num: 45, name: "Va'etchanan", heb: "וָאֶתְחַנַּן", ref: "Dt 3:23–7:11",
    haftara: "Isaías 40:1-26",
    theme: "Moshe ora para entrar na terra; o Shema e os Dez Mandamentos repetidos",
    dataDiaspora: "2026-07-25", dataIsrael: null,
    hebrewDate: "11 Av 5786", book: "Devarim",
    nota: "Shabat Nachamu — primeiro Shabat de consolação após Tisha B'Av",
  },
  {
    num: 46, name: "Eikev", heb: "עֵקֶב", ref: "Dt 7:12–11:25",
    haftara: "Isaías 49:14–51:3",
    theme: "A recompensa da obediência e o perigo do orgulho",
    dataDiaspora: "2026-08-01", dataIsrael: null,
    hebrewDate: "18 Av 5786", book: "Devarim",
  },
  {
    num: 47, name: "Re'eh", heb: "רְאֵה", ref: "Dt 11:26–16:17",
    haftara: "Isaías 54:11–55:5",
    theme: "\"Vê! Ponho diante de ti bênção e maldição\" — lei do lugar central",
    dataDiaspora: "2026-08-08", dataIsrael: null,
    hebrewDate: "25 Av 5786", book: "Devarim",
  },
  {
    num: 48, name: "Shoftim", heb: "שֹׁפְטִים", ref: "Dt 16:18–21:9",
    haftara: "Isaías 51:12–52:12",
    theme: "Juízes, reis, sacerdotes, profetas e as leis de guerra",
    dataDiaspora: "2026-08-15", dataIsrael: null,
    hebrewDate: "2 Elul 5786", book: "Devarim",
  },
  {
    num: 49, name: "Ki Teitzei", heb: "כִּי-תֵצֵא", ref: "Dt 21:10–25:19",
    haftara: "Isaías 54:1-10",
    theme: "74 mitzvot sobre família, propriedade e vida em comunidade",
    dataDiaspora: "2026-08-22", dataIsrael: null,
    hebrewDate: "9 Elul 5786", book: "Devarim",
  },
  {
    num: 50, name: "Ki Tavo", heb: "כִּי-תָבוֹא", ref: "Dt 26:1–29:8",
    haftara: "Isaías 60:1-22",
    theme: "As primícias, a Vidui Bikkurim e as bênçãos e maldições na terra",
    dataDiaspora: "2026-08-29", dataIsrael: null,
    hebrewDate: "16 Elul 5786", book: "Devarim",
  },
  {
    num: 51, name: "Nitzavim-Vayelech", heb: "נִצָּבִים-וַיֵּלֶךְ", ref: "Dt 29:9–31:30",
    haftara: "Isaías 61:10–63:9 + Oséias 14:2-10; Joel 2:15-27",
    theme: "\"Escolhe a vida!\" — Moshe encoraja o povo e escreve a Torá",
    dataDiaspora: "2026-09-05", dataIsrael: null,
    hebrewDate: "23 Elul 5786", book: "Devarim",
    double: true, nota: "Porção dupla — último Shabat antes de Rosh Hashaná 5787",
  },
  // ── INÍCIO 5787 ──
  {
    num: 53, name: "Ha'azinu", heb: "הַאֲזִינוּ", ref: "Dt 32:1–52",
    haftara: "2 Samuel 22:1-51",
    theme: "O grande cântico de Moshe — testemunho poético da história de Israel",
    dataDiaspora: "2026-09-19", dataIsrael: null,
    hebrewDate: "4 Tishrei 5787", book: "Devarim",
    nota: "Shabat Shuva — entre Rosh Hashaná e Yom Kippur 5787",
  },
  {
    num: 54, name: "V'Zot HaBracha", heb: "וְזֹאת הַבְּרָכָה", ref: "Dt 33:1–34:12",
    haftara: "Josué 1:1-18",
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
  // Semantic
  spring:       "rgba(52,211,153,0.14)",
  fall:         "rgba(251,146,60,0.14)",
  other:        "rgba(167,139,250,0.16)",
  shabat:       "rgba(233,196,106,0.09)",
  today:        "#E9C46A",
  // Nav
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
  bgCardHover:  "rgba(255,255,255,1.0)",
  bgGlass:      "rgba(248,244,237,0.88)",
  bgSection:    "rgba(255,250,243,0.96)",
  gold:         "#C9A227",       // rich gold
  goldLight:    "#E8C96A",
  goldPale:     "#F8E9B8",
  goldBg:       "rgba(201,162,39,0.10)",
  goldBorder:   "rgba(201,162,39,0.24)",
  goldGlow:     "rgba(201,162,39,0.22)",
  emerald:      "#0D9488",       // elegant teal-emerald
  emeraldLight: "#14B8A6",
  emeraldGlow:  "rgba(13,148,136,0.20)",
  orange:       "#D97706",       // warm amber
  orangeLight:  "#F59E0B",
  orangeGlow:   "rgba(217,119,6,0.20)",
  text:         "#1E293B",       // deep navy slate
  textSub:      "rgba(30,41,59,0.78)",
  textMuted:    "rgba(30,41,59,0.55)",
  textFaint:    "rgba(30,41,59,0.30)",
  blue:         "#1E3A5F",       // deep navy blue
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
      line-height: 1.55;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${theme.goldBorder}; border-radius: 2px; }

    /* Font classes */
    .cinzel    { font-family: 'Cinzel', Georgia, serif; }
    .jakarta   { font-family: 'Space Grotesk', 'Inter', sans-serif; letter-spacing: -0.01em; }
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
      <h1 className="jakarta" style={{
        fontSize: 30, fontWeight: 800, letterSpacing: "-0.025em",
        color: S.isDark ? S.goldLight : S.text, marginBottom: heb ? 6 : 4,
        lineHeight: 1.15,
      }}>{title}</h1>
      {heb && (
        <div className="hebrew" style={{ fontSize: 20, color: S.gold, opacity: 0.85, marginBottom: 6 }}>{heb}</div>
      )}
      {sub && <p style={{ color: S.textMuted, fontSize: 14, lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>{sub}</p>}
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
        border: `1px solid ${S.isDark ? S.goldBorder : S.divider}`,
        borderRadius: 24,
        padding: noPad ? 0 : 24,
        boxShadow: S.isDark
          ? "0 10px 30px -12px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 10px 30px -14px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
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
      borderRadius: 18, padding: "18px 18px", textAlign: "center",
      boxShadow: S.isDark
        ? "0 4px 14px rgba(0,0,0,0.25)"
        : "0 4px 14px rgba(15,23,42,0.06)",
    }}>
      {icon && <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <Icon name={icon} size={20} color={c} />
      </div>}
      <div className="jakarta" style={{ fontSize: 28, fontWeight: 800, color: c, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ color: S.textSub, fontSize: 12, fontWeight: 600, marginTop: 6, letterSpacing: "0.01em" }}>{label}</div>
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
        border: `1px solid ${S.isDark ? S.goldBorder : S.divider}`, borderRadius: 14,
        padding: "13px 16px", color: S.text, fontSize: 14,
        outline: "none", fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onFocus={e => { e.target.style.borderColor = S.emerald; e.target.style.boxShadow = `0 0 0 3px ${S.emeraldGlow}`; }}
      onBlur={e  => { e.target.style.borderColor = S.isDark ? S.goldBorder : S.divider; e.target.style.boxShadow = "none"; }}
    />
  );
}

// Primary action button
function PButton({ children, onClick, disabled, variant = "primary", icon, fullWidth }) {
  const styles = {
    primary: {
      background: `linear-gradient(135deg, ${S.emerald} 0%, ${S.emeraldLight} 100%)`,
      color: "#FFFFFF", border: "none",
      boxShadow: `0 8px 24px -6px ${S.emeraldGlow}, 0 2px 6px rgba(0,0,0,0.12)`,
    },
    accent: {
      background: `linear-gradient(135deg, ${S.orange} 0%, ${S.orangeLight} 100%)`,
      color: "#FFFFFF", border: "none",
      boxShadow: `0 8px 24px -6px ${S.orangeGlow}, 0 2px 6px rgba(0,0,0,0.12)`,
    },
    gold: {
      background: `linear-gradient(135deg, ${S.gold} 0%, ${S.goldLight} 100%)`,
      color: "#0A1B45", border: "none",
      boxShadow: `0 8px 24px -6px ${S.goldGlow}, 0 2px 6px rgba(0,0,0,0.12)`,
    },
    ghost: {
      background: S.goldBg, color: S.isDark ? S.goldLight : S.goldLight,
      border: `1px solid ${S.goldBorder}`,
      boxShadow: "none",
    },
    danger: {
      background: "rgba(239,68,68,0.12)", color: "#ef4444",
      border: "1px solid rgba(239,68,68,0.3)",
      boxShadow: "none",
    },
  };
  const iconColor = variant === "primary" || variant === "accent" ? "#FFFFFF"
                  : variant === "gold" ? "#0A1B45"
                  : variant === "danger" ? "#ef4444" : S.goldLight;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        borderRadius: 14, padding: "12px 24px",
        fontSize: 13.5, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s ease", opacity: disabled ? 0.6 : 1,
        fontFamily: "'Space Grotesk', 'Inter', sans-serif", letterSpacing: "0.01em",
        width: fullWidth ? "100%" : "auto",
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.filter = "brightness(1.05)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.filter = "none"; }}
    >
      {icon && <Icon name={icon} size={15} color={iconColor} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <h2 className="jakarta" style={{ fontSize: 26, fontWeight: 800, color: S.isDark ? S.goldLight : S.text,
        marginBottom: 8, letterSpacing: "-0.02em" }}>
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
      src={moedimLogoAsset.url}
      alt="Moedim"
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
  nav_feasts:     { pt:"Festas",       en:"Feasts",     es:"Fiestas",     fr:"Fêtes",       de:"Feste",       he:"מוֹעֲדִים",     ru:"Праздники" },
  nav_moon:       { pt:"Lua Nova",     en:"New Moon",   es:"Luna Nueva",  fr:"Nouvelle Lune",de:"Neumond",    he:"רֹאשׁ חֹדֶשׁ",  ru:"Новолуние" },
  nav_verse:      { pt:"Versículo",    en:"Verse",      es:"Versículo",   fr:"Verset",      de:"Vers",        he:"פָּסוּק",        ru:"Стих" },
  nav_learn:      { pt:"Aprender",     en:"Learn",      es:"Aprender",    fr:"Apprendre",   de:"Lernen",      he:"לִלְמֹד",       ru:"Учиться" },
  nav_settings:   { pt:"Config.",      en:"Settings",   es:"Config.",     fr:"Paramètres",  de:"Einstellungen",he:"הגדרות",       ru:"Настройки" },
  nav_more:       { pt:"Mais",         en:"More",       es:"Más",         fr:"Plus",        de:"Mehr",        he:"עוד",          ru:"Ещё" },
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
  // ── Festas ─────────────────────────────────────────
  upcomingFeasts: { pt:"Festas Próximas", en:"Upcoming Feasts", es:"Próximas Fiestas", fr:"Prochaines Fêtes", de:"Bevorstehende Feste", he:"מוֹעֲדִים קְרוֹבִים", ru:"Предстоящие праздники" },
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
  const tx = useT(lang);
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
            <MenorahLogo size={40} />
            <div>
              <div className="cinzel" style={{ color: S.goldLight, fontWeight: 700, fontSize: 15, lineHeight: 1, letterSpacing: "0.06em" }}>
                Moedim — Calendário Bíblico
              </div>
              <div className="hebrew" style={{ color: S.gold, fontSize: 12, opacity: 0.8, letterSpacing: "0.06em" }}>
                מוֹעֲדִים
              </div>
            </div>
          </div>
          {/* Desktop tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {TABS.map(tab => {
              const isActive = active === tab.id;
              const label = tx(tab.tKey);
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
                  {label}
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
          const label = tx(tab.tKey);
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
              }}>{label}</span>
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
            fontFamily: "'Inter', sans-serif", textTransform: "uppercase" }}>{tx("nav_more") || "Mais"}</span>
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
              const label = tx(tab.tKey);
              return (
                <button key={tab.id} onClick={() => { setActive(tab.id); setMenuOpen(false); }} style={{
                  width: "100%", background: isActive ? S.goldBg : "transparent",
                  border: "none", borderRadius: 12, padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  color: isActive ? S.goldLight : S.textSub,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <Icon name={tab.icon} size={20} color={isActive ? S.goldLight : S.textMuted} />
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{label}</span>
                  {isActive && <Icon name="check" size={16} color={S.gold} style={{ marginLeft: "auto" }} />}
                </button>
              );
            })}
            <div style={{ marginTop: 4, borderTop: `1px solid ${S.divider}`, paddingTop: 8 }}>
              <button onClick={() => setMenuOpen(false)} style={{
                width: "100%", background: "transparent", border: "none",
                padding: "8px", color: S.textMuted, cursor: "pointer",
                fontSize: 12, fontFamily: "'Inter', sans-serif",
              }}>Fechar</button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

// ─── CALENDAR PAGE ────────────────────────────────────────────────────────────

function CalendarPage() {
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
  const nextRC         = useMemo(() => getNextRoshChodesh(), []);
  const moonPhase      = useMemo(() => getMoonPhase(), []);

  const prev    = () => month === 1  ? (setMonth(12), setYear(y=>y-1)) : setMonth(m=>m-1);
  const next    = () => month === 12 ? (setMonth(1),  setYear(y=>y+1)) : setMonth(m=>m+1);
  const goToday = () => { setYear(hebrewToday.getFullYear()); setMonth(hebrewToday.getMonth()+1); };

  // Data civil para exibição (dia gregoriano real, não ajustado)
  const todayStr = now.toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long" });

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
              Novo dia hebraico iniciado
            </div>
            <div style={{ color: S.textMuted, fontSize: 11 }}>
              Após as 18h o calendário hebraico já avançou para o próximo dia.
              O dia gregoriano muda à meia-noite.
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: S.gold, fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ color: S.textMuted, fontSize: 9, marginTop: 1 }}>hora civil</div>
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
              textTransform:"uppercase", marginBottom:8 }}>הַיּוֹם — HOJE</div>
            <div className="cinzel gold-shimmer" style={{ fontSize:34, fontWeight:900, lineHeight:1, marginBottom:4 }}>
              {todayHeb.day} de {todayHeb.monthName}
            </div>
            <div className="hebrew" style={{ fontSize:26, color:S.gold, lineHeight:1, marginBottom:8 }}>
              {todayHeb.monthNameHeb} {todayHeb.year}
            </div>
            <div style={{ color:S.textMuted, fontSize:13 }}>{todayStr}</div>
            {inTransition && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(212,175,55,0.10)", border: `1px solid ${S.gold}44`,
                borderRadius: 20, padding: "3px 10px", marginTop: 8,
                fontSize: 10, color: S.gold,
              }}>
                <span>🌙</span>
                <span>Dia hebraico avançou após 18h</span>
              </div>
            )}
          </div>

          {/* Right: Quick info tiles */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {/* Parasha */}
            <div style={{ background:S.bgGlass, border:`1px solid ${S.goldBorder}`,
              borderRadius:16, padding:"12px 16px", minWidth:160 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <Icon name="scroll" size={13} color={S.gold} />
                <span style={{ color:S.textMuted, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Parashah</span>
              </div>
              <div className="cinzel" style={{ color:S.goldLight, fontWeight:700, fontSize:14 }}>{parasha?.name}</div>
              <div className="hebrew" style={{ color:S.gold, fontSize:17, lineHeight:1 }}>{parasha?.heb}</div>
              <div style={{ color:S.textMuted, fontSize:10, marginTop:2 }}>{parasha?.ref}</div>
            </div>

            {/* Moon */}
            <div style={{ background:S.bgGlass, border:`1px solid ${S.goldBorder}`,
              borderRadius:16, padding:"12px 16px", minWidth:140 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <Icon name="moon" size={13} color="#a78bfa" />
                <span style={{ color:S.textMuted, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Lua Nova</span>
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
                  <span style={{ color:S.textMuted, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>Próxima Festa</span>
                </div>
                <div className="cinzel" style={{ color:S.goldLight, fontWeight:700, fontSize:13 }}>{upcomingFeasts[0].feast.name}</div>
                <div className="hebrew" style={{ color:S.gold, fontSize:16 }}>{upcomingFeasts[0].feast.heb}</div>
                <div style={{ color:S.gold, fontSize:11, marginTop:3 }}>
                  {upcomingFeasts[0].daysAway === 0 ? "Hoje!" : upcomingFeasts[0].daysAway === 1 ? "Amanhã!" : `Em ${upcomingFeasts[0].daysAway} dias`}
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
              {MONTHS_PT[month-1]} {year}
            </div>
            <button onClick={goToday} style={{
              background:"none", border:"none", color:S.gold, fontSize:11,
              cursor:"pointer", fontFamily:"'Inter',sans-serif", marginTop:2,
            }}>Ir para hoje</button>
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
          {WEEKDAYS.map((d,i) => (
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
                  color: isToday ? "rgba(10,27,69,0.75)" : S.gold,
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
                <div style={{color:S.textSub,fontSize:12,lineHeight:1.6}}>{selDay.hasFeast.desc}</div>
                <div style={{color:S.gold,fontSize:11,marginTop:6,fontStyle:"italic"}}>📖 {selDay.hasFeast.scripture}</div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div style={{ padding:"12px 22px 16px", borderTop:`1px solid ${S.divider}`,
          display:"flex", gap:20, flexWrap:"wrap" }}>
          {[
            [S.gold,                     "Hoje (Hebraico)"],
            [S.goldLight,                "Festa Bíblica"],
            [`${S.gold}55`,              "Shabat"],
            ["rgba(212,175,55,0.30)",    "🌙 Erev (véspera)"],
          ].map(([c,l]) => (
            <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:c,
                border: l.includes("Erev") ? "1px solid rgba(212,175,55,0.5)" : "none" }}/>
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

function ParashaPage() {
  const current  = useMemo(() => getCurrentParasha(), []);
  const nextP    = useMemo(() => getNextParasha(), []);
  const [search, setSearch]       = useState("");
  const [viewMode, setViewMode]   = useState("diaspora"); // "diaspora" | "israel"
  const [expanded, setExpanded]   = useState(null);
  const [bookFilter, setBookFilter] = useState("Todos");

  const now = new Date();
  const daysUntilShabat = (6 - now.getDay() + 7) % 7 || 7;
  const nextShabatDate  = new Date(now); nextShabatDate.setDate(now.getDate() + daysUntilShabat);
  const nextShabatStr   = nextShabatDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  const BOOKS = ["Todos", "Bereshit", "Shemot", "Vayikra", "Bamidbar", "Devarim"];

  const filtered = PARASHOT_5786.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q)
      || p.theme.toLowerCase().includes(q) || (p.haftara || "").toLowerCase().includes(q);
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
      <SectionTitle sub="Leitura semanal da Torá — Ano 5786 (2025-2026)">Parashat HaShavua</SectionTitle>

      {/* ── HERO: porção atual ── */}
      {current && (
        <div className="fade-up" style={{
          background: "linear-gradient(135deg, rgba(26,43,107,0.85) 0%, rgba(212,168,67,0.08) 100%)",
          border: `1px solid ${S.gold}66`, borderRadius: 20, padding: "24px 28px",
          marginBottom: 16, position: "relative", overflow: "hidden",
        }}>
          {/* decorative bg text */}
          <div style={{ position:"absolute", top:-10, right:0, fontSize:110, opacity:0.03,
            fontFamily:"'Frank Ruhl Libre',serif", lineHeight:1 }}>תּוֹרָה</div>

          <div style={{ position: "relative" }}>
            {/* badges row */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              <Badge color={S.goldLight}>📖 ESTA SEMANA</Badge>
              <Badge color={BOOK_COLORS[current.book]?.label || S.gold}>
                {BOOK_EMOJI[current.book]} {current.book}
              </Badge>
              {current.double && <Badge color="#fb923c">⚡ Porção Dupla</Badge>}
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
                  📚 Torá: <strong style={{color:S.text}}>{current.ref}</strong>
                </div>
                <div style={{ color:S.textMuted, fontSize:13 }}>
                  🎵 Haftará: <strong style={{color:S.text}}>{current.haftara}</strong>
                </div>
                <div style={{ color:S.textMuted, fontSize:12, marginTop:4 }}>
                  📅 Shabat: <strong style={{color:S.gold}}>{fmtDate(current.dataDiaspora)}</strong>
                  {" "}• {current.hebrewDate}
                </div>
              </div>
            </div>

            {/* Israel vs Diáspora diff */}
            {current.diffIsrael && (
              <div style={{ background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.3)",
                borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
                <div style={{ color:"#a78bfa", fontWeight:700, fontSize:12, marginBottom:6 }}>
                  🌍 DIFERENÇA ISRAEL × DIÁSPORA
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ background:"rgba(4,16,46,0.4)", borderRadius:8, padding:"8px 12px" }}>
                    <div style={{ color:"#60a5fa", fontSize:10, fontWeight:700, marginBottom:3 }}>🇮🇱 ISRAEL</div>
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
                  <div style={{ background:"rgba(4,16,46,0.4)", borderRadius:8, padding:"8px 12px" }}>
                    <div style={{ color:"#4ade80", fontSize:10, fontWeight:700, marginBottom:3 }}>🌎 DIÁSPORA</div>
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
            <div style={{ background:"rgba(4,16,46,0.5)", borderRadius:10, padding:"10px 14px",
              fontSize:12, color:S.textMuted, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span>🕯️</span>
              <span>Próximo Shabat: <strong style={{color:S.gold}}>{nextShabatStr}</strong></span>
              <span style={{ color:S.goldBorder }}>•</span>
              <span>Próxima leitura: <strong style={{color:S.text}}>{nextP?.name}</strong> ({nextP?.ref})</span>
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
            <div style={{ fontSize:11, color:S.textMuted, marginBottom:3 }}>PRÓXIMA SEMANA — {fmtDate(nextP.dataDiaspora)}</div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ color:S.text, fontWeight:700, fontSize:15 }}>{nextP.name}</span>
              <span className="hebrew" style={{ color:S.gold, fontSize:20 }}>{nextP.heb}</span>
              {nextP.double && <Badge color="#fb923c">⚡ Dupla</Badge>}
            </div>
            <div style={{ color:S.textMuted, fontSize:12, marginTop:2 }}>
              📚 {nextP.ref} &nbsp;•&nbsp; 🎵 {nextP.haftara}
            </div>
            <div style={{ color:S.textMuted, fontSize:12 }}>{nextP.theme}</div>
          </div>
        </div>
      )}

      {/* ── TOGGLE MODO Israel/Diáspora ── */}
      <div style={{ display:"flex", background:S.bgCard, border:`1px solid ${S.goldBorder}`,
        borderRadius:12, padding:4, marginBottom:16, gap:4 }}>
        {[["diaspora","🌎 Diáspora"],["israel","🇮🇱 Israel"]].map(([id,label]) => (
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
            {b !== "Todos" && BOOK_EMOJI[b] + " "}{b}
          </button>
        ))}
      </div>

      {/* ── BUSCA ── */}
      <div style={{ marginBottom:16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar por nome, referência, tema ou Haftará…"
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
                    {isCur && <Badge color={S.goldLight}>● Atual</Badge>}
                    {p.double && <Badge color="#fb923c">⚡ Dupla</Badge>}
                    {p.nota && p.nota.includes("Shabat") && !p.nota.includes("Porção") && (
                      <Badge color="#a78bfa">✨</Badge>
                    )}
                  </div>
                  <div style={{ color:S.textMuted, fontSize:12 }}>
                    📚 {p.ref}
                    {displayDate && <span style={{ color:S.gold, marginLeft:8 }}>📅 {fmtDate(displayDate)}</span>}
                    {p.diffIsrael && viewMode==="israel" && p.dataIsrael && (
                      <span style={{ color:"#a78bfa", marginLeft:6, fontSize:11 }}>🇮🇱 data diferente</span>
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
                    <div style={{ background:"rgba(4,16,46,0.45)", borderRadius:10, padding:"10px 14px" }}>
                      <div style={{ color:S.gold, fontSize:10, fontWeight:700, marginBottom:4 }}>📚 TORÁ</div>
                      <div style={{ color:S.text, fontWeight:600, fontSize:14 }}>{p.name}</div>
                      <div className="hebrew" style={{ color:S.gold, fontSize:18 }}>{p.heb}</div>
                      <div style={{ color:S.textMuted, fontSize:12, marginTop:2 }}>{p.ref}</div>
                    </div>
                    {/* Haftará */}
                    <div style={{ background:"rgba(4,16,46,0.45)", borderRadius:10, padding:"10px 14px" }}>
                      <div style={{ color:"#60a5fa", fontSize:10, fontWeight:700, marginBottom:4 }}>🎵 HAFTARÁ</div>
                      <div style={{ color:S.text, fontSize:13, lineHeight:1.5 }}>{p.haftara}</div>
                    </div>
                  </div>

                  {/* Datas Israel vs Diáspora */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                    <div style={{ background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.2)",
                      borderRadius:10, padding:"8px 12px" }}>
                      <div style={{ color:"#60a5fa", fontSize:10, fontWeight:700, marginBottom:3 }}>🇮🇱 ISRAEL</div>
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
                      <div style={{ color:"#4ade80", fontSize:10, fontWeight:700, marginBottom:3 }}>🌎 DIÁSPORA</div>
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
                    {p.hebrewDate} • Ano 5786
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:40, color:S.textMuted, fontSize:14 }}>
          Nenhuma porção encontrada para "{search}"
        </div>
      )}
    </div>
  );
}

// ─── SHABAT PAGE ──────────────────────────────────────────────────────────────

const SHABAT_TEACHINGS = [
  {
    title: "O Quarto Mandamento",
    heb: "זָכוֹר אֶת יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ",
    hebTrans: "Zachor et yom haShabbat lekadsho",
    text: "Lembra do dia do Shabat para santificá-lo. Seis dias trabalharás e farás toda a tua obra; mas o sétimo dia é o Shabat do Senhor teu Deus.",
    ref: "Êxodo 20:8-10",
    icon: "📜",
    color: "#D4AF37",
  },
  {
    title: "O Descanso de Deus",
    heb: "וַיִּשְׁבֹּת בַּיּוֹם הַשְּׁבִיעִי",
    hebTrans: "Vayishbot bayom hashevi'i",
    text: "E Deus abençoou o sétimo dia e o santificou; porque nele descansou de toda a sua obra que Deus criara e fizera.",
    ref: "Gênesis 2:2-3",
    icon: "🌅",
    color: "#F2D16B",
  },
  {
    title: "Sinal Eterno da Aliança",
    heb: "בֵּינִי וּבֵין בְּנֵי יִשְׂרָאֵל אוֹת הִוא לְעֹלָם",
    hebTrans: "Beini uvein bnei Yisrael ot hi le'olam",
    text: "É sinal entre mim e os filhos de Israel para sempre; porque em seis dias fez o Senhor os céus e a terra, e ao sétimo dia descansou e tomou fôlego.",
    ref: "Êxodo 31:17",
    icon: "✡",
    color: "#6EA8FE",
  },
  {
    title: "Descanso em Yeshua",
    heb: "אָפוֹא שַׁבָּτισμός לְעַם הָאֱלֹהִים",
    hebTrans: "Apoa shabbatismos le'am haElohim",
    text: "Portanto, fica em pé um repouso sabático para o povo de Deus. Pois aquele que entrou no seu repouso, ele mesmo também descansou das suas obras, como Deus das suas.",
    ref: "Hebreus 4:9-10",
    icon: "🕊️",
    color: "#A78BFA",
  },
  {
    title: "Yeshua e o Shabat",
    heb: "כִּי קִרְיֵא כָּבוֹד הַשַּׁבָּת",
    hebTrans: "Ki kire kavod haShabbat",
    text: "E entrou na sinagoga no dia do Shabat e se levantou para ler. E foi-lhe dado o rolo do profeta Isaías. Yeshua guardava e ensinava no Shabat.",
    ref: "Lucas 4:16-17",
    icon: "📖",
    color: "#34D399",
  },
  {
    title: "Como Santificar o Sétimo Dia",
    heb: "אִם תָּשִׁיב מִשַּׁבָּת רַגְלֶךָ",
    hebTrans: "Im tashiv miShabbat raglecha",
    text: "Se no Shabat retiveres o teu pé, de fazeres o que apraz à tua alma no meu dia santo... então te deleitarás no Senhor, e te farei cavalgar sobre as alturas da terra.",
    ref: "Isaías 58:13-14",
    icon: "🌿",
    color: "#FB923C",
  },
];

const SHABAT_PRACTICES = [
  { icon: "🕯️", title: "Acender as velas",        desc: "Ao pôr do sol da sexta-feira, duas velas são acesas marcando a entrada do Shabat. A mulher cobre os olhos e recita a bênção: Baruch Atah Adonai, Eloheinu Melech haolam, asher kidshanu bemitzvotav vetzivanu lehadlik ner shel Shabat." },
  { icon: "🍷", title: "Kidush — Santificação",    desc: "Sobre uma taça de vinho (ou suco de uva), recita-se a oração de santificação do Shabat, lembrando tanto a criação quanto a saída do Egito." },
  { icon: "🍞", title: "Chalá — Pão do Sábado",   desc: "Dois pães trançados (chalot) são cobertos com um pano durante o Kidush em memória do maná duplo que Deus proveu às sextas-feiras no deserto." },
  { icon: "📖", title: "Estudo e Torá",             desc: "O Shabat é consagrado ao estudo das Escrituras, à leitura da Parashat HaShavua e à meditação na Palavra — o maior prazer espiritual do dia." },
  { icon: "🤝", title: "Família e Comunidade",     desc: "Reunir família e amigos à mesa, cantar Zmirót (hinos do Shabat), orar juntos e descansar do trabalho cotidiano é parte essencial da santificação." },
  { icon: "✨", title: "Havdalah — Separação",     desc: "Ao aparecerem três estrelas no sábado à noite, encerra-se o Shabat com o ritual de Havdalah: vinho, especiarias aromáticas e uma vela trançada, separando o sagrado do profano." },
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
      <SectionTitle sub="O sétimo dia é sagrado — um sinal eterno entre Deus e Seu povo">
        🕯️ Shabat — שַׁבָּת
      </SectionTitle>

      {/* ── HERO: Contagem Regressiva ── */}
      <div className="fade-up" style={{
        background: isShabatNow
          ? `linear-gradient(145deg, rgba(212,175,55,0.18), rgba(26,43,107,0.6))`
          : `linear-gradient(145deg, rgba(10,27,69,0.9), rgba(22,39,84,0.8))`,
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
                Shabat Shalom!
              </div>
              <div className="hebrew" style={{ color: S.gold, fontSize: 28, marginBottom: 10 }}>
                שַׁבָּת שָׁלוֹם
              </div>
              <div style={{ color: S.textSub, fontSize: 13 }}>
                O sétimo dia sagrado está acontecendo agora. Descanse em Deus.
              </div>
            </>
          ) : (
            <>
              <div style={{ color: S.textMuted, fontSize: 12, marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {isFridayNow ? "O Shabat começa hoje ao entardecer" : "Próximo Shabat em"}
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
                  ? "Esta noite ao pôr do sol — prepare seu coração!"
                  : `${daysUntilFriday} ${daysUntilFriday === 1 ? "dia" : "dias"} até o início do Shabat`}
              </div>
            </>
          )}

          {/* Data hebraica atual */}
          <div style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.05)", borderRadius: 20,
            padding: "6px 16px", border: `1px solid ${S.goldBorder}`,
          }}>
            <span style={{ color: S.textMuted, fontSize: 11 }}>Hoje:</span>
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
                  : "Calcular horários locais de Shabat"}
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
          "Lembra do dia do Shabat para santificá-lo."
        </div>
        <div style={{ color: S.gold, fontSize: 12 }}>Êxodo 20:8 — O Quarto Mandamento</div>
      </div>

      {/* ── Ensinamentos expandíveis ── */}
      <div style={{ marginBottom: 16 }}>
        <div className="cinzel" style={{
          color: S.goldLight, fontSize: 14, fontWeight: 700,
          letterSpacing: "0.05em", marginBottom: 12, textAlign: "center",
        }}>
          O QUE DIZ A ESCRITURA
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SHABAT_TEACHINGS.map((t, i) => {
            const isOpen = expanded === i;
            return (
              <div key={i} style={{
                background: isOpen ? `${t.color}0e` : S.bgCard,
                border: `1.5px solid ${isOpen ? t.color + "44" : S.goldBorder}`,
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
                    background: `${t.color}18`, border: `1.5px solid ${t.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                  }}>{t.icon}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ color: isOpen ? t.color : S.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                      {t.title}
                    </div>
                    <div className="hebrew" style={{ color: `${t.color}99`, fontSize: 13 }}>
                      {t.heb}
                    </div>
                  </div>

                  <div style={{
                    color: isOpen ? t.color : S.textMuted,
                    fontSize: 18, lineHeight: 1, transition: "transform 0.25s",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}>⌄</div>
                </div>

                {/* Conteúdo expandido */}
                {isOpen && (
                  <div className="fade-up" style={{
                    padding: "0 16px 16px",
                    borderTop: `1px solid ${t.color}22`,
                  }}>
                    <div style={{
                      background: "rgba(4,16,46,0.35)", borderRadius: 10,
                      padding: "10px 14px", marginBottom: 10, marginTop: 10,
                    }}>
                      <div className="hebrew" style={{
                        color: t.color, fontSize: 16, lineHeight: 1.8,
                        marginBottom: 6, textAlign: "right",
                      }}>{t.heb}</div>
                      <div style={{ color: S.textMuted, fontSize: 11, textAlign: "center", fontStyle: "italic" }}>
                        {t.hebTrans}
                      </div>
                    </div>
                    <p style={{ color: S.textSub, fontSize: 13, lineHeight: 1.75, marginBottom: 8 }}>
                      {t.text}
                    </p>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      color: t.color, fontSize: 12, fontStyle: "italic",
                    }}>
                      <span>📖</span> {t.ref}
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
          COMO SANTIFICAR O SHABAT
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {SHABAT_PRACTICES.map((p, i) => (
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
                }}>{p.icon}</div>
                <div style={{ color: S.text, fontWeight: 700, fontSize: 13 }}>{p.title}</div>
              </div>
              <p style={{ color: S.textMuted, fontSize: 12, lineHeight: 1.65 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bênção do Shabat ── */}
      <div style={{
        background: `linear-gradient(135deg, rgba(10,27,69,0.8), rgba(22,39,84,0.6))`,
        border: `1px solid ${S.goldBorder}`, borderRadius: 20,
        padding: "24px", textAlign: "center",
      }}>
        <div style={{ color: S.textMuted, fontSize: 11, letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>
          Bênção Sacerdotal do Shabat
        </div>
        <div className="hebrew" style={{ color: S.goldLight, fontSize: 20, lineHeight: 2, marginBottom: 8 }}>
          יְבָרֶכְךָ יְהוָה וְיִשְׁמְרֶךָ
          <br />
          יָאֵר יְהוָה פָּנָיו אֵלֶיךָ וִיחֻנֶּךָּ
          <br />
          יִשָּׂא יְהוָה פָּנָיו אֵלֶיךָ וְיָשֵׂם לְךָ שָׁלוֹם
        </div>
        <div style={{ color: S.textSub, fontSize: 12, lineHeight: 1.8, fontStyle: "italic" }}>
          "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto
          <br/>sobre ti e te dê graça; o Senhor volte o seu rosto para ti e te dê paz."
        </div>
        <div style={{ color: S.gold, fontSize: 11, marginTop: 8 }}>Números 6:24-26</div>
        <div style={{ marginTop: 14 }}>
          <span className="cinzel hebrew" style={{ color: S.gold, fontSize: 18 }}>שַׁבָּת שָׁלוֹם</span>
          <span style={{ color: S.textMuted, fontSize: 13, marginLeft: 8 }}>— Shabat Shalom!</span>
        </div>
      </div>
    </div>
  );
}

// ─── FEASTS PAGE ──────────────────────────────────────────────────────────────

function FeastsPage() {
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
                {feast.cat === "spring" ? "Primavera" : feast.cat === "fall" ? "Outono" : "Outras"}
              </span>
              {upcomingInfo && <Badge color={S.goldLight}>{upcomingInfo.daysAway === 0 ? "Hoje!" : upcomingInfo.daysAway === 1 ? "Amanhã!" : `${upcomingInfo.daysAway} dias`}</Badge>}
            </div>
            <div className="hebrew" style={{ color: S.gold, fontSize: 20 }}>{feast.heb}</div>
            <div style={{ color: S.textMuted, fontSize: 12, marginTop: 2 }}>{feast.date} • {feast.dur} {feast.dur === 1 ? "dia" : "dias"}</div>
          </div>
          <span style={{ color: S.textMuted, fontSize: 18, marginLeft: 8 }}>{isSel ? "▲" : "▼"}</span>
        </div>

        {isSel && (
          <div className="fade-up" style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${S.goldBorder}` }}>
            <p style={{ color: S.text, fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>{feast.desc}</p>
            <div style={{ background: S.goldBg, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ color: S.goldLight, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✡ SIGNIFICADO MESSIÂNICO</div>
              <p style={{ color: S.text, fontSize: 13, lineHeight: 1.6 }}>{feast.sig}</p>
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
      <SectionTitle sub="Os Moadim — Encontros Marcados pelo Eterno">Festas Bíblicas</SectionTitle>

      {/* Upcoming alerts */}
      {upcoming.length > 0 && (
        <div className="fade-up" style={{ background: S.goldBg, border: `1px solid ${S.goldBorder}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>⭐ Festas Próximas (próximos 365 dias)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map(({ feast, date, daysAway }) => (
              <div key={feast.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(4,16,46,0.4)", borderRadius: 10 }}>
                <span style={{ fontSize: 22 }}>{feast.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: S.text, fontWeight: 600, fontSize: 13 }}>{feast.name}</div>
                  <div style={{ color: S.textMuted, fontSize: 11 }}>{date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</div>
                </div>
                <Badge color={daysAway === 0 ? "#4ade80" : daysAway <= 7 ? S.goldLight : S.gold}>
                  {daysAway === 0 ? "Hoje!" : daysAway === 1 ? "Amanhã" : `${daysAway} dias`}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", background: S.bgCard, border: `1px solid ${S.goldBorder}`, borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
        <TabBtn id="upcoming" label="🌸 Primavera" />
        <TabBtn id="fall" label="🍂 Outono" />
        <TabBtn id="other" label="✨ Outras" />
      </div>

      {tab === "upcoming" && spring.map(f => <FeastCard key={f.name} feast={f} upcomingInfo={upcomingMap[f.name]} />)}
      {tab === "fall" && fall.map(f => <FeastCard key={f.name} feast={f} upcomingInfo={upcomingMap[f.name]} />)}
      {tab === "other" && other.map(f => <FeastCard key={f.name} feast={f} upcomingInfo={upcomingMap[f.name]} />)}
    </div>
  );
}

// ─── LEARN PAGE ───────────────────────────────────────────────────────────────

function LearnPage() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 100px" }}>
      <SectionTitle sub="Os 13 meses do calendário bíblico hebraico">Os Meses Hebraicos</SectionTitle>

      <Card style={{ marginBottom: 24, background: "rgba(26,43,107,0.4)" }}>
        <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>📖 O Calendário Lunissolar</div>
        <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.7 }}>
          O calendário hebraico é <strong style={{ color: S.text }}>lunissolar</strong> — baseado nos ciclos da lua e do sol.
          O primeiro mês bíblico é <strong style={{ color: S.gold }}>Nissan</strong> (Êxodo 12:2), e o ano civil começa em <strong style={{ color: S.gold }}>Tishrei</strong> (Rosh Hashaná).
          O ano hebraico conta desde a criação do mundo (Anno Mundi); adicione ~3760 ao ano gregoriano.
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
                    <span style={{ background: S.goldBg, color: S.gold, fontSize: 10, padding: "2px 8px", borderRadius: 20, border: `1px solid ${S.goldBorder}` }}>{m.id}º mês</span>
                    <span style={{ color: S.textMuted, fontSize: 11 }}>{m.approx}</span>
                  </div>
                  <div style={{ color: S.text, fontWeight: 700, fontSize: 16 }}>{m.name}</div>
                  <div className="hebrew" style={{ color: S.gold, fontSize: 22 }}>{m.heb}</div>
                  <div style={{ color: S.textMuted, fontSize: 12, fontStyle: "italic" }}>"{m.desc}"</div>
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

      <Card style={{ marginTop: 24, background: "rgba(26,43,107,0.4)" }}>
        <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>✡ Conexão Messiânica</div>
        <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.7 }}>
          Para os crentes messiânicos, o calendário bíblico revela o plano redentor de Deus através de Yeshua.
          As festas da <strong style={{ color: "#4ade80" }}>primavera</strong> foram cumpridas em Sua primeira vinda,
          enquanto as festas do <strong style={{ color: "#fb923c" }}>outono</strong> apontam para Sua segunda vinda e o reinado eterno.
        </p>
      </Card>
    </div>
  );
}

// ─── PWA INSTALL BANNER ───────────────────────────────────────────────────────

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShow(true); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
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
      background: `linear-gradient(135deg, rgba(26,43,107,0.98), rgba(4,16,46,0.98))`,
      border: `1px solid ${S.gold}`, borderRadius: 16, padding: 16,
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: `0 8px 32px rgba(212,168,67,0.2)`,
    }}>
      <span style={{ fontSize: 28 }}>✡</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: S.goldLight, fontWeight: 700, fontSize: 13 }}>Instalar Moedim</div>
        <div style={{ color: S.textMuted, fontSize: 11 }}>Acesse offline a qualquer momento</div>
      </div>
      <button onClick={install} style={{ background: S.gold, border: "none", color: S.bg, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Instalar</button>
      <button onClick={() => setShow(false)} style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", fontSize: 18 }}>×</button>
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

function NotificationManager() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [enabled, setEnabled] = useState(false);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm === "granted") {
      setEnabled(true);
      // Notify about upcoming feasts
      const upcoming = getUpcomingFeasts(7);
      upcoming.forEach(({ feast, daysAway }) => {
        const delay = daysAway === 0 ? 0 : 1000;
        setTimeout(() => {
          new Notification(`${feast.emoji} ${feast.name} se aproxima!`, {
            body: daysAway === 0 ? "Esta festa é hoje! " + feast.desc : `Em ${daysAway} dias: ${feast.desc}`,
            icon: "/icon-192.png",
          });
        }, delay);
      });
    }
  };

  if (permission === "granted" && enabled) return null;

  return (
    <div style={{
      background: S.bgCard, border: `1px solid ${S.goldBorder}`,
      borderRadius: 12, padding: "12px 16px", marginBottom: 16,
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 20 }}>🔔</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: S.text, fontWeight: 600, fontSize: 13 }}>Notificações de Festas</div>
        <div style={{ color: S.textMuted, fontSize: 11 }}>Receba alertas sobre as festas bíblicas próximas</div>
      </div>
      {permission === "denied" ? (
        <span style={{ color: "#f87171", fontSize: 11 }}>Bloqueado nas configurações</span>
      ) : (
        <button onClick={requestPermission} style={{
          background: S.goldBg, border: `1px solid ${S.goldBorder}`,
          color: S.goldLight, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Ativar</button>
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
    blessing: "Judá é um leãozinho… O cetro não se apartará de Judá. (Gn 49:9-10)",
    desc: "A tribo dos reis e líderes. Yehudá marchava à frente de Israel, sendo a tribo do rei Davi e de Yeshua HaMashiach.",
    qualities: ["Liderança", "Coragem", "Lealdade", "Realeza"],
    challenge: "Orgulho e necessidade de controle",
    scripture: "Gênesis 49:8-12; Números 2:3-9",
  },
  {
    monthId: 2, monthName: "Iyar",
    tribe: "Yissachar", heb: "יִשָּׂשכָר", eng: "Issachar",
    symbol: "🐂", mazal: "Touro ♉", stone: "Topázio",
    stoneHeb: "פִּטְדָה", color: "#d97706",
    blessing: "Yissachar é um jumento forte, deitado entre as alforjas. (Gn 49:14)",
    desc: "A tribo dos sábios e estudiosos da Torá. Especialistas em astronomia e no calendário hebraico, conheciam os tempos e as estações.",
    qualities: ["Sabedoria", "Dedicação ao estudo", "Discernimento dos tempos", "Paciência"],
    challenge: "Isolamento intelectual",
    scripture: "Gênesis 49:14-15; 1 Crônicas 12:32",
  },
  {
    monthId: 3, monthName: "Sivan",
    tribe: "Zevulun", heb: "זְבוּלוּן", eng: "Zebulun",
    symbol: "⚓", mazal: "Gêmeos ♊", stone: "Esmeralda",
    stoneHeb: "בָּרֶקֶת", color: "#16a34a",
    blessing: "Zevulun habitará à beira do mar, será porto de navios. (Gn 49:13)",
    desc: "A tribo dos comerciantes e navegadores. Zevulun sustentava financeiramente os estudos de Yissachar, sendo modelo de parceria entre trabalho e Torá.",
    qualities: ["Generosidade", "Espírito empreendedor", "Parceria", "Prosperidade"],
    challenge: "Materialismo excessivo",
    scripture: "Gênesis 49:13; Deuteronômio 33:18-19",
  },
  {
    monthId: 4, monthName: "Tammuz",
    tribe: "Reuven", heb: "רְאוּבֵן", eng: "Reuben",
    symbol: "🌊", mazal: "Câncer ♋", stone: "Cornalina",
    stoneHeb: "אֹדֶם", color: "#2563eb",
    blessing: "Reuven, tu és meu primogênito, minha força… (Gn 49:3)",
    desc: "O primogênito de Yaakov. Um mês de vulnerabilidade e reflexão. Tammuz foi mês de queda (bezerro de ouro), mas também de potencial de arrependimento e restauração.",
    qualities: ["Sensibilidade", "Capacidade de arrependimento", "Empatia", "Visão"],
    challenge: "Impulsividade e instabilidade emocional",
    scripture: "Gênesis 49:3-4; Números 1:20-21",
  },
  {
    monthId: 5, monthName: "Av",
    tribe: "Shimon", heb: "שִׁמְעוֹן", eng: "Simeon",
    symbol: "🗡️", mazal: "Leão ♌", stone: "Esmeralda",
    stoneHeb: "נֹפֶךְ", color: "#7c3aed",
    blessing: "Shimon e Levi são irmãos; suas espadas são instrumentos de violência. (Gn 49:5)",
    desc: "A tribo do fervor e da intensidade. Av é o mês mais difícil do calendário (destruição do Templo), mas porta a semente da maior luz. O nome Shimon vem de 'ouvir'.",
    qualities: ["Fervor espiritual", "Intensidade", "Ouvir a voz de Deus", "Transformação"],
    challenge: "Ira e impulsividade destrutiva",
    scripture: "Gênesis 49:5-7; Números 1:22-23",
  },
  {
    monthId: 6, monthName: "Elul",
    tribe: "Gad", heb: "גָּד", eng: "Gad",
    symbol: "⚔️", mazal: "Virgem ♍", stone: "Diamante",
    stoneHeb: "יָהֲלֹם", color: "#0891b2",
    blessing: "Gad, um exército o atacará, mas ele atacará o calcanhar deles. (Gn 49:19)",
    desc: "A tribo dos guerreiros e dos vencedores. Elul é o mês de preparação e teshuvá (arrependimento) antes de Rosh Hashaná — o guerreiro se prepara para o julgamento.",
    qualities: ["Coragem militar", "Resiliência", "Preparação", "Superação"],
    challenge: "Agressividade desnecessária",
    scripture: "Gênesis 49:19; Deuteronômio 33:20-21",
  },
  {
    monthId: 7, monthName: "Tishrei",
    tribe: "Efraim", heb: "אֶפְרַיִם", eng: "Ephraim",
    symbol: "🌳", mazal: "Libra ♎", stone: "Ônix",
    stoneHeb: "שֹׁהַם", color: "#059669",
    blessing: "Seu descendente se tornará uma multidão de nações. (Gn 48:19)",
    desc: "Filho de Yosef, recebeu a bênção do primogênito. Tishrei é o mês mais rico em festas — Rosh Hashaná, Yom Kippur e Sukkot. Efraim representa multiplicação e renovação.",
    qualities: ["Multiplicação", "Renovação", "Equilíbrio (balança de Tishrei)", "Frutificação"],
    challenge: "Dispersão de foco",
    scripture: "Gênesis 48:14-20; Deuteronômio 33:17",
  },
  {
    monthId: 8, monthName: "Cheshvan",
    tribe: "Menashe", heb: "מְנַשֶּׁה", eng: "Manasseh",
    symbol: "💧", mazal: "Escorpião ♏", stone: "Ágata",
    stoneHeb: "שְׁבוֹ", color: "#1d4ed8",
    blessing: "Que Deus te faça como Efraim e Menashe. (Gn 48:20)",
    desc: "O primogênito de Yosef. Cheshvan é o único mês sem festas — um mês de introspecção profunda e trabalho silencioso. Menashe representa esquecer o sofrimento passado e seguir em frente.",
    qualities: ["Introspecção", "Superação do passado", "Trabalho silencioso", "Perseverança"],
    challenge: "Melancolia e isolamento",
    scripture: "Gênesis 41:51; 48:14-20",
  },
  {
    monthId: 9, monthName: "Kislev",
    tribe: "Binyamin", heb: "בִּנְיָמִן", eng: "Benjamin",
    symbol: "🐺", mazal: "Sagitário ♐", stone: "Ametista",
    stoneHeb: "אַחְלָמָה", color: "#7c3aed",
    blessing: "Binyamin é um lobo que devora; de manhã consome a presa. (Gn 49:27)",
    desc: "O filho amado de Yaakov e Raquel. Kislev é o mês de Chanukah — a festa da luz e da dedicação. Binyamin era o único filho nascido em Eretz Israel, representando santidade e intimidade com o sagrado.",
    qualities: ["Intimidade com o sagrado", "Proteção feroz", "Devoção", "Luz na escuridão"],
    challenge: "Impulsividade e territorialismo",
    scripture: "Gênesis 49:27; Deuteronômio 33:12",
  },
  {
    monthId: 10, monthName: "Tevet",
    tribe: "Dan", heb: "דָּן", eng: "Dan",
    symbol: "🐍", mazal: "Capricórnio ♑", stone: "Berilo",
    stoneHeb: "תַּרְשִׁישׁ", color: "#374151",
    blessing: "Dã julgará seu povo como uma das tribos de Israel. (Gn 49:16)",
    desc: "A tribo dos juízes e do discernimento. Tevet é um mês sombrio (jejum do 10 de Tevet), mas Dan representa a capacidade de distinguir o bem do mal e fazer justiça.",
    qualities: ["Discernimento", "Senso de justiça", "Percepção aguçada", "Julgamento justo"],
    challenge: "Cinismo e julgamento excessivo",
    scripture: "Gênesis 49:16-18; Juízes 13-16 (Sansão)",
  },
  {
    monthId: 11, monthName: "Shevat",
    tribe: "Asher", heb: "אָשֵׁר", eng: "Asher",
    symbol: "🌿", mazal: "Aquário ♒", stone: "Berilo",
    stoneHeb: "שֹׁהַם", color: "#65a30d",
    blessing: "De Asher virá pão excelente; ele produzirá delícias reais. (Gn 49:20)",
    desc: "A tribo da abundância e das bênçãos materiais. Shevat é o Ano Novo das Árvores (Tu BiShvat) — tempo de renovação e gratidão pelos frutos da terra. Asher representa alegria e contentamento.",
    qualities: ["Alegria", "Abundância", "Gratidão", "Contentamento"],
    challenge: "Conformismo e acomodação",
    scripture: "Gênesis 49:20; Deuteronômio 33:24-25",
  },
  {
    monthId: 12, monthName: "Adar",
    tribe: "Naftali", heb: "נַפְתָּלִי", eng: "Naphtali",
    symbol: "🦌", mazal: "Peixes ♓", stone: "Ametista",
    stoneHeb: "אַחְלָמָה", color: "#0284c7",
    blessing: "Naftali é uma gazela solta, que pronuncia belas palavras. (Gn 49:21)",
    desc: "A tribo da leveza, alegria e belas palavras. Adar é o mês de Purim — alegria e celebração. Naftali era veloz como uma gazela, representando espiritualidade ágil e palavras inspiradas.",
    qualities: ["Alegria", "Leveza", "Eloquência", "Agilidade espiritual"],
    challenge: "Superficialidade e inconstância",
    scripture: "Gênesis 49:21; Deuteronômio 33:23",
  },
  {
    monthId: 13, monthName: "Adar II",
    tribe: "Naftali", heb: "נַפְתָּלִי", eng: "Naphtali",
    symbol: "🦌", mazal: "Peixes ♓", stone: "Ametista",
    stoneHeb: "אַחְלָמָה", color: "#0284c7",
    blessing: "Naftali é uma gazela solta, que pronuncia belas palavras. (Gn 49:21)",
    desc: "Segundo Adar — em anos embolísmicos (bissextos). Purim é celebrado no Adar II nestes anos. A duplicidade do mês amplifica a alegria e a redenção.",
    qualities: ["Alegria duplicada", "Graça divina", "Redenção", "Renovação"],
    challenge: "Inconstância",
    scripture: "Ester 9:20-28",
  },
];

// Mapa de acesso rápido por ID
const TRIBE_BY_MONTH = Object.fromEntries(TRIBES.map(t => [t.monthId, t]));

// ─── CONVERSOR DE DATAS PAGE ──────────────────────────────────────────────────

function ConverterPage() {
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
    const weekday = new Date(y,m-1,d).toLocaleDateString("pt-BR",{weekday:"long"});
    // Próximo aniversário hebraico (ano corrente gregoriano)
    setBirthResult({ hd, tribe, feast, weekday, gDate: new Date(y,m-1,d) });
  }

  function doConvert() {
    const [y,m,d] = convertDate.split("-").map(Number);
    if (!y||!m||!d) return;
    const hd    = gregorianToHebrew(y,m,d);
    const tribe = TRIBE_BY_MONTH[hd.month] || null;
    const feast = BIBLICAL_FEASTS.find(f => f.month===hd.month && hd.day>=f.day && hd.day<f.day+f.dur) || null;
    const weekdayHeb = ["Yom Rishon","Yom Sheni","Yom Shlishi","Yom Revi'i","Yom Chamishi","Yom Shishi","Shabat"];
    const wday = new Date(y,m-1,d).getDay();
    setConvResult({ hd, tribe, feast, weekdayHeb: weekdayHeb[wday], wday });
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
                Mês de {tribe.monthName}
              </span>
            </div>
          </div>
        </div>

        {/* bênção */}
        <div style={{background:"rgba(4,16,46,0.5)",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
          <div style={{color:S.gold,fontSize:10,fontWeight:700,marginBottom:4}}>📜 BÊNÇÃO DE YAAKOV</div>
          <p style={{color:S.text,fontSize:12,fontStyle:"italic",lineHeight:1.6}}>{tribe.blessing}</p>
        </div>

        {/* descrição */}
        <p style={{color:S.textMuted,fontSize:13,lineHeight:1.7,marginBottom:12}}>{tribe.desc}</p>

        {/* qualidades e desafio */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div style={{background:`${tribe.color}10`,borderRadius:10,padding:"10px 12px"}}>
            <div style={{color:tribe.color,fontSize:10,fontWeight:700,marginBottom:6}}>✨ DONS</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {tribe.qualities.map(q => (
                <span key={q} style={{color:S.text,fontSize:11,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:tribe.color,flexShrink:0,display:"inline-block"}}/>
                  {q}
                </span>
              ))}
            </div>
          </div>
          <div style={{background:"rgba(239,68,68,0.08)",borderRadius:10,padding:"10px 12px"}}>
            <div style={{color:"#f87171",fontSize:10,fontWeight:700,marginBottom:6}}>⚔️ DESAFIO</div>
            <p style={{color:S.textMuted,fontSize:11,lineHeight:1.5}}>{tribe.challenge}</p>
            <div style={{marginTop:8,color:S.gold,fontSize:10,fontStyle:"italic"}}>{tribe.scripture}</div>
          </div>
        </div>

        {/* pedra hoshen */}
        <div style={{background:"rgba(212,168,67,0.06)",border:`1px solid ${S.goldBorder}`,borderRadius:10,
          padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>💎</span>
          <div>
            <div style={{color:S.gold,fontSize:10,fontWeight:700}}>PEDRA DO HOSHEN (PEITORAL DO SUMO SACERDOTE)</div>
            <div style={{color:S.text,fontSize:12}}>{tribe.stone} <span className="hebrew" style={{color:S.gold}}>— {tribe.stoneHeb}</span></div>
            <div style={{color:S.textMuted,fontSize:11}}>Êxodo 28:15-21 • Tribo: {tribe.eng}</div>
          </div>
        </div>
      </div>
    );
  };

  const HebrewDateDisplay = ({ hd, label, sub }) => (
    <div style={{background:"rgba(4,16,46,0.5)",borderRadius:14,padding:18,textAlign:"center"}}>
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
      <SectionTitle sub="Descubra sua data no calendário bíblico e sua tribo de Israel">
        Conversor de Datas
      </SectionTitle>

      {/* Toggle */}
      <div style={{display:"flex",background:S.bgCard,border:`1px solid ${S.goldBorder}`,
        borderRadius:12,padding:4,marginBottom:24,gap:4}}>
        {[
          ["birth",   "🎂 Meu Aniversário Hebraico"],
          ["convert", "📅 Converter Qualquer Data"],
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
              🎂 Digite sua data de nascimento
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input type="date" value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                style={{flex:1,minWidth:160,background:"rgba(4,16,46,0.6)",
                  border:`1px solid ${S.goldBorder}`,borderRadius:10,padding:"10px 14px",
                  color:S.text,fontSize:15,outline:"none",colorScheme:"dark"}}
              />
              <button onClick={doBirth} style={{
                background:`linear-gradient(135deg,${S.gold},${S.goldLight})`,
                border:"none",borderRadius:10,padding:"10px 24px",
                color:S.bg,fontWeight:700,fontSize:14,cursor:"pointer",whiteSpace:"nowrap",
              }}>Descobrir ✡</button>
            </div>
          </div>

          {birthResult && (
            <div className="fade-up">
              {/* Data hebraica + weekday */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:20}}>
                <HebrewDateDisplay hd={birthResult.hd} label="Seu nascimento no calendário hebraico"
                  sub={`Nasceu numa ${birthResult.weekday}`}/>
                <div style={{background:"rgba(26,43,107,0.5)",borderRadius:14,padding:18}}>
                  <div style={{color:S.textMuted,fontSize:11,marginBottom:10}}>RESUMO BÍBLICO</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>Mês Hebraico</span>
                      <span style={{color:S.text,fontWeight:600}}>{birthResult.hd.monthName}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>Dia Hebraico</span>
                      <span style={{color:S.text,fontWeight:600}}>{birthResult.hd.day}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>Ano Hebraico</span>
                      <span style={{color:S.text,fontWeight:600}}>{birthResult.hd.year} AM</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>Tribo</span>
                      <span style={{color:S.goldLight,fontWeight:700}}>{birthResult.tribe?.tribe || "—"}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>Mazal</span>
                      <span style={{color:S.gold,fontWeight:600}}>{birthResult.tribe?.mazal || "—"}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                      <span style={{color:S.textMuted}}>Pedra</span>
                      <span style={{color:S.gold,fontWeight:600}}>💎 {birthResult.tribe?.stone || "—"}</span>
                    </div>
                    {birthResult.feast && (
                      <div style={{marginTop:6,padding:"8px 10px",background:S.goldBg,borderRadius:8,
                        border:`1px solid ${S.goldBorder}`}}>
                        <div style={{color:S.goldLight,fontSize:11,fontWeight:700}}>
                          {birthResult.feast.emoji} Nasceu durante {birthResult.feast.name}!
                        </div>
                        <div style={{color:S.textMuted,fontSize:10,marginTop:2}}>{birthResult.feast.desc}</div>
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
                      ✡ Sua Tribo de Israel
                    </div>
                    <p style={{color:S.textMuted,fontSize:12,marginTop:4}}>
                      Baseado no mês hebraico do seu nascimento — tradição do Sefer Yetzirah
                    </p>
                  </div>
                  <TribeCard tribe={birthResult.tribe} hd={birthResult.hd} />
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
              📅 Data Gregoriana
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <input type="date" value={convertDate}
                onChange={e => setConvertDate(e.target.value)}
                style={{flex:1,minWidth:160,background:"rgba(4,16,46,0.6)",
                  border:`1px solid ${S.goldBorder}`,borderRadius:10,padding:"10px 14px",
                  color:S.text,fontSize:15,outline:"none",colorScheme:"dark"}}
              />
              <button onClick={doConvert} style={{
                background:`linear-gradient(135deg,${S.gold},${S.goldLight})`,
                border:"none",borderRadius:10,padding:"10px 24px",
                color:S.bg,fontWeight:700,fontSize:14,cursor:"pointer",whiteSpace:"nowrap",
              }}>Converter ✡</button>
            </div>
          </div>

          {convResult && (
            <div className="fade-up">
              {/* Resultado principal */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:20}}>
                <HebrewDateDisplay hd={convResult.hd} label="Data no Calendário Hebraico"
                  sub={convResult.weekdayHeb}/>
                {/* Conversão dupla */}
                <div style={{background:"rgba(26,43,107,0.5)",borderRadius:14,padding:18}}>
                  <div style={{color:S.textMuted,fontSize:11,marginBottom:10}}>EQUIVALÊNCIA</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{background:"rgba(4,16,46,0.5)",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{color:S.textMuted,fontSize:10,marginBottom:3}}>GREGORIANO</div>
                      <div style={{color:S.text,fontWeight:600,fontSize:14}}>
                        {new Date(convertDate+"T12:00:00").toLocaleDateString("pt-BR",
                          {day:"2-digit",month:"long",year:"numeric"})}
                      </div>
                    </div>
                    <div style={{background:S.goldBg,borderRadius:10,padding:"10px 12px",
                      border:`1px solid ${S.goldBorder}`}}>
                      <div style={{color:S.gold,fontSize:10,marginBottom:3}}>HEBRAICO</div>
                      <div style={{color:S.goldLight,fontWeight:700,fontSize:14}}>
                        {convResult.hd.day} de {convResult.hd.monthName}{" "}
                        <span className="hebrew" style={{fontSize:16}}>{convResult.hd.monthNameHeb}</span>
                      </div>
                      <div style={{color:S.textMuted,fontSize:12}}>{convResult.hd.year} Anno Mundi</div>
                    </div>
                    {/* dia da semana hebraico */}
                    <div style={{background:"rgba(4,16,46,0.5)",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{color:S.textMuted,fontSize:10,marginBottom:3}}>DIA DA SEMANA HEBRAICO</div>
                      <div style={{color:convResult.wday===6?S.goldLight:S.text,fontWeight:600,fontSize:13}}>
                        {convResult.weekdayHeb}
                        {convResult.wday===6 && <span style={{color:S.gold}}> 🕯️ Shabat!</span>}
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
                    {convResult.feast.emoji} Esta data é {convResult.feast.name}!
                  </div>
                  <p style={{color:S.text,fontSize:13,lineHeight:1.6,marginBottom:6}}>{convResult.feast.desc}</p>
                  <p style={{color:S.textMuted,fontSize:12,fontStyle:"italic"}}>{convResult.feast.sig}</p>
                  <div style={{color:S.gold,fontSize:12,marginTop:6}}>📖 {convResult.feast.scripture}</div>
                </div>
              )}

              {/* Tribo do mês */}
              {convResult.tribe && (
                <>
                  <div style={{textAlign:"center",margin:"8px 0 16px"}}>
                    <div className="display-font" style={{color:S.goldLight,fontSize:18,fontWeight:700}}>
                      ✡ Tribo do Mês de {convResult.hd.monthName}
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
            As 12 Tribos de Israel e os Meses Hebraicos
          </div>
          <p style={{color:S.textMuted,fontSize:12,marginTop:4}}>
            Baseado no Sefer Yetzirah, Arizal e tradição judaica
          </p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
          {TRIBES.filter(t => t.monthId <= 12).map(t => (
            <div key={t.monthId} style={{
              background:`${t.color}0d`, border:`1px solid ${t.color}33`,
              borderRadius:13, padding:"12px 14px",
              transition:"all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = `${t.color}1a`}
              onMouseLeave={e => e.currentTarget.style.background = `${t.color}0d`}
            >
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{width:40,height:40,borderRadius:10,background:`${t.color}22`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                  {t.symbol}
                </div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{color:S.text,fontWeight:700,fontSize:14}}>{t.tribe}</span>
                    <span className="hebrew" style={{color:t.color,fontSize:18}}>{t.heb}</span>
                  </div>
                  <div style={{color:S.textMuted,fontSize:11}}>{t.mazal} · {t.monthName}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {t.qualities.slice(0,2).map(q => (
                  <span key={q} style={{background:`${t.color}1a`,color:t.color,fontSize:10,
                    padding:"2px 8px",borderRadius:20,border:`1px solid ${t.color}33`}}>{q}</span>
                ))}
                <span style={{background:"rgba(212,168,67,0.1)",color:S.gold,fontSize:10,
                  padding:"2px 8px",borderRadius:20,border:`1px solid ${S.goldBorder}`}}>
                  💎 {t.stone}
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

function RoshChodeshPage() {
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
      <SectionTitle sub="Rosh Chodesh — O Início de Cada Mês Hebraico">🌙 Lua Nova</SectionTitle>

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
          Dia {Math.floor(phase) + 1} do ciclo lunar • {phase.toFixed(1)} dias desde a Lua Nova
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
            Hoje: <strong style={{ color: "#e8d5ff" }}>
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
              PRÓXIMO ROSH CHODESH
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <span className="display-font" style={{ color: "#e8d5ff", fontSize: 22, fontWeight: 700 }}>
                {nextRC.month}
              </span>
              <span className="hebrew" style={{ color: "#a78bfa", fontSize: 24 }}>{nextRC.heb}</span>
            </div>
            <div style={{ color: "rgba(220,200,255,0.6)", fontSize: 13 }}>
              📅 {new Date(nextRC.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
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
              {daysUntil <= 0 ? "HOJE!" : daysUntil === 1 ? "dia" : "dias"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Calendário completo de Rosh Chodesh ── */}
      <div style={{ marginBottom: 20 }}>
        <div className="display-font" style={{ color: S.goldLight, fontSize: 17, fontWeight: 700,
          marginBottom: 14, textAlign: "center" }}>
          Calendário de Rosh Chodesh 5786
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
                      {new Date(rc.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                    <div style={{ color: "rgba(167,139,250,0.6)", fontSize: 11, marginTop: 2 }}>{rc.note}</div>
                  </div>
                  <div style={{
                    background: isNext ? "rgba(99,102,241,0.25)" : isPast ? "rgba(255,255,255,0.05)" : S.goldBg,
                    borderRadius: 8, padding: "4px 8px", fontSize: 11, fontWeight: 700,
                    color: isNext ? "#a78bfa" : isPast ? S.textMuted : S.gold, whiteSpace: "nowrap",
                  }}>
                    {isPast ? "Passado" : isToday ? "Hoje!" : `${rc.diff}d`}
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
          🌙 O Significado de Rosh Chodesh
        </div>
        <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.8 }}>
          Rosh Chodesh (ראש חודש) significa "cabeça do mês" — o dia da Lua Nova. No calendário hebraico,
          cada novo mês começa com a renovação da lua, símbolo de renovação espiritual para Israel.
          As mulheres têm uma conexão especial com Rosh Chodesh, pois se recusaram a dar seus ornamentos
          para o bezerro de ouro (Êxodo 32), sendo recompensadas com este dia sagrado.
        </p>
        <p style={{ color: S.textMuted, fontSize: 13, lineHeight: 1.8, marginTop: 8 }}>
          Nos tempos do Templo, Rosh Chodesh era declarado por testemunhas que avistavam a lua nova.
          Ofertas especiais eram trazidas (Números 28:11-15) e o shofar era tocado. Para os crentes
          messiânicos, aponta para a renovação em Yeshua — "a quem pertence a sombra, mas o corpo
          pertence ao Messias" (Colossenses 2:17).
        </p>
        <div style={{ marginTop: 12, color: S.gold, fontSize: 12, fontStyle: "italic" }}>
          📖 Números 28:11-15 • Isaías 66:23 • Colossenses 2:16-17
        </div>
      </div>
    </div>
  );
}

// ─── VERSÍCULO DIÁRIO PAGE ─────────────────────────────────────────────────────

function VersePage() {
  const verse = useMemo(() => getDailyVerse(), []);
  const [showHeb, setShowHeb] = useState(true);
  const [showPt,  setShowPt]  = useState(true);
  const [copied,  setCopied]  = useState(false);
  const todayHeb = useMemo(() => getTodayHebrew(), []);
  const todayStr = new Date().toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });

  const shareText = `📖 ${verse.ref}

${verse.heb}

"${verse.pt}"

— Moedim — Calendário Bíblico`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `Versículo do Dia — ${verse.ref}`, text: shareText });
    } else { handleCopy(); }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 100px" }}>
      <SectionTitle sub={`${todayStr} • ${todayHeb.day} de ${todayHeb.monthName} ${todayHeb.year} AM`}>
        ✡ Versículo Diário
      </SectionTitle>

      {/* Hero card */}
      <div className="fade-up" style={{
        background: "linear-gradient(160deg, rgba(26,43,107,0.9) 0%, rgba(212,168,67,0.08) 100%)",
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
          [showHeb, setShowHeb, "עִב", "Hebraico"],
          [showPt,  setShowPt,  "PT",  "Português"],
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
          {copied ? "✓ Copiado!" : "📋 Copiar"}
        </button>
        <button onClick={handleWhatsApp} style={{
          background:"rgba(37,211,102,0.12)", border:"1px solid rgba(37,211,102,0.3)",
          color:"#25d366", borderRadius:10, padding:"10px 20px", fontSize:13,
          fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8,
        }}>
          📲 WhatsApp
        </button>
        <button onClick={handleShare} style={{
          background: S.goldBg, border:`1px solid ${S.goldBorder}`,
          color:S.goldLight, borderRadius:10, padding:"10px 20px", fontSize:13,
          fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:8,
        }}>
          🔗 Compartilhar
        </button>
      </div>

      {/* Todos os versículos */}
      <div>
        <div className="display-font" style={{ color:S.goldLight, fontSize:17, fontWeight:700,
          marginBottom:14, textAlign:"center" }}>
          Todos os Versículos ({DAILY_VERSES.length})
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
                    padding:"2px 7px", borderRadius:20 }}>HOJE</span>}
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
    default: return "Moedim — Calendário Bíblico";
  }
}

function fireTestNotif(key, label) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const icons = { shabat:"🕯️", feasts:"⭐", parasha:"📖", rosh:"🌙" };
  new Notification(`${icons[key] || "✡"} ${label} — Moedim`, {
    body: getNotifBody(key),
    tag: `moedim-test-${key}`,
    renotify: true,
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
    heb: "מוֹעֲדִים",
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
  const [perm,       setPerm]       = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [requesting, setRequesting] = useState(false);
  const [feedback,   setFeedback]   = useState({});   // { key: "saved"|"tested" }
  const [saved,      setSaved]      = useState(false);
  const isDark = theme.isDark;

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
    if (typeof Notification === "undefined") return;
    setRequesting(true);
    const p = await Notification.requestPermission();
    setPerm(p);
    setRequesting(false);
    if (p === "granted") {
      setTimeout(() => {
        new Notification("✡ Moedim ativado!", {
          body: "Você receberá alertas de Shabat, Festas, Parashah e Rosh Chodesh.",
          tag: "moedin-welcome",
        });
      }, 600);
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
      <PageTitle icon="settings" title="Configurações" sub="Personalize sua experiência" />

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
              Aparência
            </div>
            <div style={{ color:S.textMuted, fontSize:11 }}>Escolha o tema visual</div>
          </div>
        </div>

        {/* Seletor de tema */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            {
              t: DARK_THEME, name:"Escuro", desc:"Noite de Jerusalém",
              preview: "linear-gradient(135deg,#060F2A,#0A1B45,#162754)",
              active: isDark, accentActive:"#D4AF37",
              stars: true,
            },
            {
              t: LIGHT_THEME, name:"Claro", desc:"Pergaminho da Torá",
              preview: "linear-gradient(135deg,#EDE6D8,#F8F4ED,#FFFDF9)",
              active: !isDark, accentActive:"#C9A227",
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
                  }}>✓ ATIVO</div>
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
          {isDark ? "🌙 Noite de Jerusalém" : "☀️ Pergaminho da Torá"}
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
              {T.language[lang] || "Idioma"}
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
                Notificações
              </div>
              <div style={{ color:S.textMuted, fontSize:11 }}>
                {permGranted ? `${activeCount} de ${NOTIF_DEFS.length} tipos ativos` : "Configure os alertas"}
              </div>
            </div>
          </div>
          {saved && (
            <span style={{
              background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)",
              color:"#34d399", fontSize:11, fontWeight:700,
              padding:"4px 12px", borderRadius:20, display:"flex", alignItems:"center", gap:5,
            }}>
              <Icon name="check" size={12} color="#34d399" strokeWidth={2.5} /> Salvo
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
                {permGranted ? "Notificações permitidas"
                  : permDenied ? "Notificações bloqueadas"
                  : "Permissão necessária"}
              </div>
              <div style={{ color:S.textMuted, fontSize:12, lineHeight:1.5 }}>
                {permGranted
                  ? "O app pode enviar alertas. Configure cada tipo abaixo."
                  : permDenied
                  ? "Acesse Configurações do navegador → Notificações → Permitir para este site."
                  : "Toque em Ativar para receber alertas de Shabat, Festas e mais."}
              </div>
            </div>
            {permPending && (
              <PButton onClick={requestPerm} disabled={requesting} icon="bell">
                {requesting ? "Aguarde…" : "Ativar"}
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
                <span>Tipos habilitados</span>
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
                      }}>{item.label}</span>
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
                        }}>Salvo ✓</span>
                      )}
                    </div>
                    <div style={{ color:S.textMuted, fontSize:11, lineHeight:1.4 }}>{item.when}</div>
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
                      {item.detail}
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
                        {item.verse}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); testNotif(item.key, item.label); }}
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
                          ? <><Icon name="check" size={11} color="#34d399" strokeWidth={2.5}/>Enviada!</>
                          : <><Icon name="bell" size={11} color={item.color}/>Testar agora</>
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
                      ? "Bloqueado — habilite nas configurações do navegador"
                      : "Ative as notificações acima para configurar"}
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
              Ativar todas
            </PButton>
            <PButton variant="danger" onClick={disableAll} fullWidth>
              Desativar todas
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
              Moedim — Calendário Bíblico
            </div>
            <div className="hebrew" style={{ color:S.gold, fontSize:18 }}>מוֹעֲדִים</div>
            <div style={{ color:S.textMuted, fontSize:11 }}>Encontros Marcados pelo Eterno</div>
          </div>
        </div>

        <GoldDivider my={12} />

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { icon:"calendar", label:"Calendário", desc:"Hebraico + gregoriano" },
            { icon:"convert",  label:"Conversor",  desc:"Com tribos de Israel" },
            { icon:"scroll",   label:"Parashah",   desc:"Ciclo real 5786" },
            { icon:"candle",   label:"Shabat",     desc:"Horários por GPS" },
            { icon:"star",     label:"Festas",     desc:"Moadim messiânicos" },
            { icon:"moon",     label:"Rosh Chodesh",desc:"Fase lunar real" },
            { icon:"book",     label:"Versículo",  desc:"30 versos em Heb+PT" },
            { icon:"settings", label:"Configurações",desc:"Tema + notificações" },
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
        <NotificationManager />
      </div>

      {/* Page content */}
      <main style={{ minHeight: "70vh" }}>
        {pages[activeTab]}
      </main>

      <InstallBanner />

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
          <MenorahLogo size={28} glow={false} />
          <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${S.goldBorder}, transparent)` }}/>
        </div>
        <div className="hebrew" style={{ color:S.gold, fontSize:17, marginBottom:6, opacity:0.9 }}>
          שַׁבָּת שָׁלוֹם
        </div>
        <div className="cinzel" style={{ color:S.textFaint, fontSize:11, letterSpacing:"0.08em" }}>
          MOEDIM — CALENDÁRIO BÍBLICO • מוֹעֲדִים
        </div>
        <div style={{ color:S.textFaint, fontSize:10, marginTop:4, fontFamily:"'Inter',sans-serif" }}>
          Encontros Marcados pelo Eterno
        </div>
      </footer>
    </>
  );
}
