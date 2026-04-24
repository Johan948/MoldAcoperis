const commonPolicies = [
    'Raspunde ca un consultant MoldAcoperis calm, clar si prietenos, nu ca un robot generic.',
    'Foloseste raspunsuri scurte: de obicei 2-5 propozitii. Daca subiectul este complex, structureaza natural, fara markdown agresiv.',
    'Nu inventa preturi exacte, stocuri, termene ferme, garantii sau specificatii care nu sunt mentionate in context.',
    'Nu publica tarife finale pe m2 ca raspuns standard. Explica faptul ca pretul depinde de suprafata, forma acoperisului, produs, accesorii, sistem de scurgere si localitate.',
    'Cand utilizatorul intreaba de pret, raspunde orientativ si directioneaza elegant spre oferta personalizata.',
    'Cand utilizatorul are intentie comerciala, cere nume, telefon, localitate si produsul sau tipul acoperisului.',
    'Daca utilizatorul nu stie ce sa aleaga, pune 1-2 intrebari simple despre forma acoperisului, buget, aspect dorit si localitate.',
    'Recomanda sistem complet si compatibil: invelitoare, accesorii, ventilare, membrane, fixari si sistem de scurgere.',
    'Nu promova montajul ca pagina sau serviciu separat. Vorbeste despre acoperis complet, executie corecta sau oferta personalizata.',
    'Nu recomanda tabla cutata ca prima optiune pentru case rezidentiale standard daca tigla metalica, tigla modulara sau sindrila bituminoasa sunt mai potrivite.',
    'Cand compari produse, explica diferente practice: aspect, greutate, pierderi, logistica, reparatii, zgomot la ploaie, potrivire pentru acoperis simplu sau complex.',
    'Daca raspunsul depaseste informatiile disponibile, spune asta direct si recomanda discutia cu un consultant MoldAcoperis.',
    'Nu spune ca o cerere a fost trimisa sau inregistrata decat dupa confirmarea reala a formularului.'
];

const commonPoliciesRu = [
    'Отвечай как спокойный, понятный и дружелюбный консультант MoldAcoperis, а не как общий робот.',
    'Давай короткие ответы: обычно 2-5 предложений. Если тема сложная, объясняй естественно, без агрессивного markdown.',
    'Не выдумывай точные цены, наличие, жесткие сроки, гарантии или технические характеристики, если их нет в контексте.',
    'Не публикуй финальные тарифы за м2 как стандартный ответ. Объясняй, что цена зависит от площади, формы крыши, продукта, аксессуаров, водостока и населенного пункта.',
    'Когда пользователь спрашивает цену, отвечай ориентировочно и мягко веди к персональному предложению.',
    'Если есть коммерческий интерес, попроси имя, телефон, населенный пункт и продукт или тип кровли.',
    'Если пользователь не знает, что выбрать, задай 1-2 простых вопроса о форме крыши, бюджете, желаемом внешнем виде и населенном пункте.',
    'Рекомендуй полную совместимую систему: кровельное покрытие, аксессуары, вентиляцию, мембраны, крепеж и водосток.',
    'Не продвигай монтаж как отдельную страницу или отдельную услугу. Говори о полной кровельной системе, корректном исполнении или персональном предложении.',
    'Не рекомендуй профнастил как первый вариант для стандартного жилого дома, если металлочерепица, модульная металлочерепица или битумная черепица подходят лучше.',
    'Когда сравниваешь продукты, объясняй практические различия: внешний вид, вес, отходы, логистику, ремонт, шум дождя, пригодность для простой или сложной крыши.',
    'Если ответ выходит за рамки доступной информации, скажи это прямо и предложи связаться с консультантом MoldAcoperis.',
    'Не говори, что заявка отправлена или зарегистрирована, пока сайт реально не подтвердил отправку формы.'
];

const productPortfolioRo = [
    {
        title: 'Tigla metalica modulara',
        content: 'Solutie moderna si premium, livrata in module compacte. Este potrivita pentru case noi, renovari si acoperisuri cu geometrie mai complexa. Avantaje: transport compact, manipulare mai usoara, pierderi mai mici, interventii locale mai simple si aspect premium. Pe site sunt promovate inclusiv forme exclusive precum Parma si Panorama.'
    },
    {
        title: 'Repere tehnice tigla metalica modulara',
        content: 'Reperele comunicate pe site includ grosime 0.45-0.50 mm, greutate aproximativa 4.8-5.2 kg/m2, panta minima 14 grade, zincare 180-275 g/m2 si garantie orientativa 30-50 ani in functie de acoperire. Gama include variante de calitate Standard, Premium si VIP, iar alegerea se face in functie de buget si asteptari.'
    },
    {
        title: 'Tigla metalica clasica',
        content: 'Una dintre cele mai populare solutii pentru acoperisuri in Moldova. Este usoara, eficienta si versatila pentru acoperisuri simple sau medii. Pe site apar profile precum Enigma, Eterna, Getica, Laguna, Optima si Regalis. Recomandarea depinde de forma casei, preferinta estetica si buget.'
    },
    {
        title: 'Sindrila bituminoasa',
        content: 'Material flexibil si elegant, potrivit pentru acoperisuri complexe, mansarde, turele, multe dolii sau forme unde materialele metalice produc pierderi mai mari. Avantaje: adaptare buna la detalii, aspect uniform si confort acustic mai bun la ploaie.'
    },
    {
        title: 'Tabla cutata',
        content: 'Sistem practic pentru anexe, hale, constructii tehnice, garduri, streasini si zone unde conteaza rigiditatea si eficienta. Pentru case rezidentiale standard, trebuie comparata atent cu tigla metalica, tigla modulara si sindrila bituminoasa.'
    },
    {
        title: 'Sistem de scurgere',
        content: 'Protejeaza fatada, soclul, fundatia si zona din jurul casei prin evacuarea controlata a apei. Pe site este tratat ca sistem complet: jgheaburi, burlane, coltare, carlige, coliere, racorduri si accesorii compatibile. Pentru case standard apare logica 125/87, iar pentru suprafete mari 150/100.'
    },
    {
        title: 'Accesorii pentru acoperis',
        content: 'Accesoriile sunt importante pentru etansare, ventilare, coama, dolie, fronton, streașina, fixare si finisaje. Recomandarea MoldAcoperis este sistem complet compatibil, nu piese alese izolat doar dupa pret.'
    }
];

const productPortfolioRu = [
    {
        title: 'Модульная металлочерепица',
        content: 'Современное премиальное решение в компактных модулях. Подходит для новых домов, реконструкций и более сложной геометрии крыши. Преимущества: компактная транспортировка, удобная работа на объекте, меньше отходов, более простой локальный ремонт и премиальный внешний вид. На сайте продвигаются также эксклюзивные формы Parma и Panorama.'
    },
    {
        title: 'Технические ориентиры модульной металлочерепицы',
        content: 'На сайте указаны ориентиры: толщина 0.45-0.50 мм, вес примерно 4.8-5.2 кг/м2, минимальный уклон 14 градусов, цинковое покрытие 180-275 г/м2 и ориентировочная гарантия 30-50 лет в зависимости от покрытия. Есть уровни Standard, Premium и VIP, выбор зависит от бюджета и ожиданий.'
    },
    {
        title: 'Классическая металлочерепица',
        content: 'Один из самых популярных вариантов кровли в Молдове. Легкая, эффективная и универсальная для простых и средних крыш. На сайте представлены профили Enigma, Eterna, Getica, Laguna, Optima и Regalis. Рекомендация зависит от формы дома, желаемого внешнего вида и бюджета.'
    },
    {
        title: 'Битумная черепица',
        content: 'Гибкий и аккуратный материал для сложных крыш, мансард, башенок, большого количества ендов и форм, где металлические материалы могут давать больше отходов. Преимущества: хорошая адаптация к деталям, цельный внешний вид и более комфортная акустика во время дождя.'
    },
    {
        title: 'Профнастил',
        content: 'Практичное решение для пристроек, ангаров, технических объектов, заборов, подшивки и зон, где важны жесткость и эффективность. Для стандартного жилого дома его нужно сравнивать с металлочерепицей, модульной металлочерепицей и битумной черепицей.'
    },
    {
        title: 'Водосточная система',
        content: 'Защищает фасад, цоколь, фундамент и участок вокруг дома за счет контролируемого отвода воды. На сайте рассматривается как полная система: желоба, трубы, углы, крюки, хомуты, соединители и совместимые аксессуары. Для стандартных домов используется логика 125/87, для больших площадей 150/100.'
    },
    {
        title: 'Кровельные аксессуары',
        content: 'Аксессуары важны для герметичности, вентиляции, конька, ендовы, фронтона, карниза, крепления и финишных узлов. Рекомендация MoldAcoperis: полная совместимая система, а не отдельные детали, выбранные только по цене.'
    }
];

const salesTopicsRo = [
    {
        title: 'Compania MoldAcoperis',
        content: 'MoldAcoperis este o companie specializata in solutii pentru acoperisuri in Chisinau si in toata Moldova. Site-ul comunica experienta de peste 14 ani, peste 1500 de proiecte finalizate, echipa de consultanti si accent pe recomandari practice pentru case reale.'
    },
    {
        title: 'Contact si zona de lucru',
        content: 'Date publice: telefon +373 79 360 360, email moldacoperis@gmail.com, adresa Calea Basarabiei 30, Chisinau. Compania activeaza in Chisinau si in toata Moldova.'
    },
    {
        title: 'Echipa',
        content: 'Pe pagina Despre noi sunt prezentate roluri precum manageri de proiecte, director comercial, ingineri constructori si director general. Chatul nu trebuie sa dea telefoane personale ale membrilor echipei ca raspuns standard; pentru contact se foloseste numarul principal al companiei.'
    },
    {
        title: 'Pozitionare comerciala',
        content: 'MoldAcoperis trebuie pozitionat ca partener pentru alegerea sistemului corect de acoperis, nu doar ca magazin de materiale. Accentul cade pe compatibilitate, durabilitate, oferta personalizata si evitarea deciziilor luate doar dupa cel mai mic pret.'
    },
    {
        title: 'Preturi',
        content: 'Raspunsul corect despre pret: pretul este orientativ si depinde de suprafata, forma acoperisului, material, grosime, acoperire, accesorii, sistem de scurgere si localitate. Pentru o estimare corecta este necesara oferta personalizata. CTA recomandat: trimite localitatea, suprafata aproximativa si o poza sau proiect.'
    },
    {
        title: 'Calculatorul de pret',
        content: 'Calculatorul de pe site ofera estimari orientative, nu deviz final. Chatul trebuie sa il prezinte ca instrument util pentru orientare, dar sa recomande validarea de catre consultant pentru proiecte reale.'
    },
    {
        title: 'Cum colectezi o cerere',
        content: 'Pentru cerere sunt necesare minim: nume, telefon, localitate si produsul sau tipul acoperisului. Detalii utile suplimentare: suprafata aproximativa, tip casa, forma acoperisului, poze, schita sau proiect.'
    },
    {
        title: 'Stil de conversatie',
        content: 'Tonul trebuie sa fie natural, cald si competent. Botul trebuie sa raspunda direct la intrebare, apoi sa ofere pasul urmator. Nu trebuie sa fie insistent, dar trebuie sa invite clientul spre apel, WhatsApp sau oferta personalizata cand exista interes comercial.'
    },
    {
        title: 'Intrebari bune de calificare',
        content: 'Daca utilizatorul este indecis, intreaba: acoperisul este simplu sau complex, ce suprafata aproximativa are, in ce localitate este casa, prefera aspect metalic sau mai silentios la ploaie, doreste sistem complet sau doar material.'
    }
];

const salesTopicsRu = [
    {
        title: 'Компания MoldAcoperis',
        content: 'MoldAcoperis специализируется на кровельных решениях в Кишиневе и по всей Молдове. На сайте указаны более 14 лет опыта, более 1500 завершенных проектов, команда консультантов и акцент на практических рекомендациях для реальных домов.'
    },
    {
        title: 'Контакты и зона работы',
        content: 'Публичные данные: телефон +373 79 360 360, email moldacoperis@gmail.com, адрес Calea Basarabiei 30, Chisinau. Компания работает в Кишиневе и по всей Молдове.'
    },
    {
        title: 'Команда',
        content: 'На странице О нас представлены менеджеры проектов, коммерческий директор, инженеры-строители и генеральный директор. Чат не должен стандартно выдавать личные телефоны сотрудников; для контакта используется основной номер компании.'
    },
    {
        title: 'Коммерческое позиционирование',
        content: 'MoldAcoperis нужно позиционировать как партнера по подбору правильной кровельной системы, а не просто как магазин материалов. Акцент: совместимость, долговечность, персональное предложение и отказ от выбора только по минимальной цене.'
    },
    {
        title: 'Цены',
        content: 'Правильный ответ о цене: цена ориентировочная и зависит от площади, формы крыши, материала, толщины, покрытия, аксессуаров, водостока и населенного пункта. Для корректной оценки нужно персональное предложение. Рекомендуемый CTA: отправьте населенный пункт, примерную площадь и фото или проект.'
    },
    {
        title: 'Калькулятор цены',
        content: 'Калькулятор на сайте дает ориентировочную оценку, а не финальную смету. Чат должен представлять его как полезный инструмент для ориентира, но рекомендовать проверку консультантом для реального проекта.'
    },
    {
        title: 'Как собрать заявку',
        content: 'Для заявки нужны минимум: имя, телефон, населенный пункт и продукт или тип кровли. Дополнительные полезные детали: примерная площадь, тип дома, форма крыши, фото, схема или проект.'
    },
    {
        title: 'Стиль общения',
        content: 'Тон должен быть естественным, теплым и компетентным. Бот должен прямо отвечать на вопрос, затем предлагать следующий шаг. Не нужно давить, но при коммерческом интересе нужно мягко вести к звонку, WhatsApp или персональному предложению.'
    },
    {
        title: 'Хорошие уточняющие вопросы',
        content: 'Если пользователь не знает, что выбрать, спроси: крыша простая или сложная, какая примерная площадь, в каком населенном пункте дом, нужен металлический внешний вид или более тихая кровля во время дождя, нужна полная система или только материал.'
    }
];

const faqRo = [
    {
        question: 'Cat costa un acoperis?',
        answer: 'Pretul final depinde de suprafata, forma, material, grosime, accesorii, sistem de scurgere si localitate. Calculatorul ofera orientare, iar pentru o estimare corecta este nevoie de oferta personalizata.'
    },
    {
        question: 'Ce date sunt necesare pentru oferta?',
        answer: 'Nume, telefon, localitate si produsul sau tipul acoperisului. Daca exista suprafata aproximativa, poze, schita sau proiect, estimarea va fi mai buna.'
    },
    {
        question: 'Lucrati doar in Chisinau?',
        answer: 'Nu. MoldAcoperis lucreaza in Chisinau si in toata Moldova.'
    },
    {
        question: 'Ce aleg intre tigla metalica si tigla modulara?',
        answer: 'Tigla modulara este mai comoda la transport si pe acoperisuri complexe, cu pierderi mai mici si reparatii locale mai simple. Tigla metalica clasica ramane eficienta pentru multe acoperisuri simple sau medii.'
    },
    {
        question: 'Cand se recomanda sindrila bituminoasa?',
        answer: 'Cand acoperisul are forme complexe, multe detalii sau cand clientul doreste un aspect uniform si confort acustic mai bun la ploaie.'
    },
    {
        question: 'Ce sistem de scurgere trebuie ales?',
        answer: 'Pentru case standard se foloseste frecvent logica 125/87, iar pentru suprafete mai mari 150/100. Alegerea depinde de suprafata acoperisului si debitul de apa.'
    },
    {
        question: 'Este calculatorul un pret final?',
        answer: 'Nu. Calculatorul este orientativ. Pretul final trebuie validat prin oferta personalizata.'
    }
];

const faqRu = [
    {
        question: 'Сколько стоит крыша?',
        answer: 'Финальная цена зависит от площади, формы, материала, толщины, аксессуаров, водостока и населенного пункта. Калькулятор дает ориентир, а точнее считать нужно через персональное предложение.'
    },
    {
        question: 'Какие данные нужны для предложения?',
        answer: 'Имя, телефон, населенный пункт и продукт или тип кровли. Если есть примерная площадь, фото, схема или проект, расчет будет точнее.'
    },
    {
        question: 'Вы работаете только в Кишиневе?',
        answer: 'Нет. MoldAcoperis работает в Кишиневе и по всей Молдове.'
    },
    {
        question: 'Что выбрать: классическую или модульную металлочерепицу?',
        answer: 'Модульная удобнее в транспортировке и на сложных крышах, дает меньше отходов и проще в локальном ремонте. Классическая металлочерепица остается эффективной для многих простых и средних крыш.'
    },
    {
        question: 'Когда подходит битумная черепица?',
        answer: 'Когда крыша имеет сложные формы, много деталей или клиент хочет цельный внешний вид и более тихое поведение во время дождя.'
    },
    {
        question: 'Какой водосток выбрать?',
        answer: 'Для стандартных домов часто используется 125/87, для больших площадей 150/100. Выбор зависит от площади крыши и объема воды.'
    },
    {
        question: 'Калькулятор дает финальную цену?',
        answer: 'Нет. Калькулятор дает ориентир. Финальную цену нужно подтвердить персональным предложением.'
    }
];

const knowledgeBase = {
    ro: {
        company: {
            name: 'MoldAcoperis',
            phone: '+373 79 360 360',
            email: 'moldacoperis@gmail.com',
            address: 'Calea Basarabiei 30, Chisinau',
            area: 'Chisinau si toata Moldova',
            experience: '14+ ani experienta',
            projects: '1500+ proiecte finalizate'
        },
        policies: commonPolicies,
        faq: faqRo,
        topics: [
            ...salesTopicsRo,
            ...productPortfolioRo
        ]
    },
    ru: {
        company: {
            name: 'MoldAcoperis',
            phone: '+373 79 360 360',
            email: 'moldacoperis@gmail.com',
            address: 'Calea Basarabiei 30, Chisinau',
            area: 'Кишинев и вся Молдова',
            experience: '14+ лет опыта',
            projects: '1500+ завершенных проектов'
        },
        policies: commonPoliciesRu,
        faq: faqRu,
        topics: [
            ...salesTopicsRu,
            ...productPortfolioRu
        ]
    }
};

module.exports = {
    knowledgeBase
};
