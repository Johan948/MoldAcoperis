const commonPolicies = [
    'Raspunde doar pe baza informatiilor MoldAcoperis disponibile in knowledge base.',
    'Nu inventa preturi exacte, stocuri, termene ferme sau garantii care nu sunt mentionate clar.',
    'Nu prezenta tabla cutata ca recomandare principala pentru acoperisuri rezidentiale standard, daca exista variante mai potrivite precum tigla metalica, tigla metalica modulara sau sindrila bituminoasa.',
    'Cand utilizatorul cere oferta sau vrea sa fie contactat, cere nume, telefon, localitate si tipul acoperisului ori produsul dorit.',
    'Cand utilizatorul compara produse, explica pe scurt diferentele practice: montaj, pierderi, logistica, reparatii, aspect si potrivirea pentru geometria acoperisului.',
    'Daca intrebarea depaseste informatiile disponibile, recomanda contactul direct cu echipa MoldAcoperis.'
];

const commonPoliciesRu = [
    'Отвечай только на основе информации MoldAcoperis из базы знаний.',
    'Не выдумывай точные цены, наличие, точные сроки или гарантии, если они не указаны явно.',
    'Не предлагай профнастил как основное решение для стандартных жилых крыш, если есть более подходящие варианты: металлочерепица, модульная металлочерепица или битумная черепица.',
    'Если пользователь хочет предложение или обратный звонок, запрашивай имя, телефон, населенный пункт и тип крыши либо нужный продукт.',
    'Когда пользователь сравнивает продукты, кратко объясняй практические различия: монтаж, отходы, логистика, ремонт, внешний вид и пригодность для геометрии крыши.',
    'Если вопрос выходит за пределы доступной информации, рекомендуй связаться с командой MoldAcoperis.'
];

const knowledgeBase = {
    ro: {
        company: {
            name: 'MoldAcoperis',
            phone: '+373 79 360 360',
            email: 'moldacoperis@gmail.com',
            address: 'Calea Basarabiei 30, Chisinau',
            area: 'Chisinau si toata Moldova'
        },
        policies: commonPolicies,
        faq: [
            {
                question: 'Ce este tigla metalica modulara?',
                answer: 'Tigla metalica modulara este o invelitoare metalica livrata in module compacte, nu in foi lungi. Este apreciata pentru montaj mai usor, transport compact, pierderi mai mici si reparatii locale mai simple.'
            },
            {
                question: 'Care este diferenta intre tigla metalica modulara si tigla metalica clasica?',
                answer: 'Modulara este mai practica la transport, manipulare si optimizarea pierderilor, mai ales pe acoperisuri complexe. Tigla metalica clasica ramane foarte eficienta pentru multe proiecte rezidentiale, in special cand geometria acoperisului este mai simpla.'
            },
            {
                question: 'Ce garantie are tigla metalica modulara?',
                answer: 'Pe site, pentru tigla metalica modulara este mentionata o garantie orientativa intre 30 si 50 de ani, in functie de tipul de acoperire.'
            },
            {
                question: 'Ce grosime are tigla metalica modulara?',
                answer: 'Pentru tigla metalica modulara sunt mentionate grosimi de 0.45 mm pana la 0.50 mm, in functie de varianta aleasa.'
            },
            {
                question: 'Ce panta minima are tigla metalica modulara?',
                answer: 'Pe pagina de produs este mentionata o panta minima de 14 grade pentru tigla metalica modulara.'
            },
            {
                question: 'Ce date tehnice importante are tigla metalica modulara?',
                answer: 'Reperele importante de pe site sunt: dimensiune utila modul 770 x 1190 mm, grosime 0.45 - 0.50 mm, greutate 4.8 - 5.2 kg/m2, zincare 180 - 275 g/m2 si garantie 30 - 50 ani.'
            },
            {
                question: 'Cand este recomandata sindrila bituminoasa?',
                answer: 'Sindrila bituminoasa este recomandata in special pentru acoperisuri cu forme complexe, multe detalii si zone unde conteaza flexibilitatea materialului si un aspect uniform.'
            },
            {
                question: 'Ce dimensiune de sistem de scurgere se recomanda?',
                answer: 'Pe site este prezentata logica 125/87 pentru case standard si 150/100 pentru suprafete mai mari. Alegerea depinde de dimensiunea acoperisului si de debitul de apa ce trebuie evacuat.'
            },
            {
                question: 'Tabla cutata este potrivita pentru acoperisuri rezidentiale?',
                answer: 'Nu ar trebui recomandata automat ca varianta principala pentru un acoperis rezidential standard daca exista solutii mai potrivite precum tigla metalica, tigla modulara sau sindrila bituminoasa.'
            },
            {
                question: 'De ce depinde pretul final al acoperisului?',
                answer: 'Pretul final depinde de produs, grosime, acoperire, suprafata, forma acoperisului, complexitate, accesorii si uneori montaj. De aceea, pentru un raspuns sigur, este recomandata o oferta personalizata.'
            },
            {
                question: 'Ce date sunt necesare pentru o oferta?',
                answer: 'Datele de baza utile sunt nume, telefon, localitate si tipul acoperisului sau produsul dorit. Daca exista schita, suprafata sau poze, acestea ajuta si mai mult.'
            },
            {
                question: 'MoldAcoperis livreaza doar in Chisinau?',
                answer: 'Nu. MoldAcoperis lucreaza in Chisinau si in toata Moldova.'
            },
            {
                question: 'Pot cere si montaj, nu doar material?',
                answer: 'Da. Pe site montajul este prezentat ca parte dintr-un sistem complet, impreuna cu accesoriile, foliile, ventilarea si celelalte componente importante.'
            }
        ],
        topics: [
            {
                title: 'MoldAcoperis pe scurt',
                content: 'MoldAcoperis lucreaza in Chisinau si in toata Moldova si livreaza atat materiale pentru acoperis, cat si sisteme complete cu accesorii, drenaj si, la cerere, montaj sau consultanta pentru proiect.'
            },
            {
                title: 'Tigla metalica modulara',
                content: 'Tigla metalica modulara face parte din oferta MoldAcoperis si este pozitionata ca o solutie moderna, premium si practica. Avantajele comunicate pe site sunt montajul rapid, transportul compact, pierderile minime de material, reparatiile mai usoare si aspectul modern. Exista doua forme exclusive, greu de gasit pe piata locala.'
            },
            {
                title: 'Date tehnice tigla metalica modulara',
                content: 'Pe site sunt mentionate pentru tigla modulara urmatoarele repere: dimensiune utila modul 770 x 1190 mm, grosime tabla 0.45 - 0.50 mm, greutate 4.8 - 5.2 kg per metru patrat, panta minima 14 grade, zincare 180 - 275 g pe metru patrat, acoperiri precum Polyester, Polyester Mat, PVDF si Pural, plus garantie orientativa 30 - 50 ani in functie de acoperire.'
            },
            {
                title: 'Cand recomanzi tigla metalica modulara',
                content: 'Tigla metalica modulara este foarte potrivita pentru case noi, inlocuiri de acoperis si in special pentru geometrii mai complexe, unde manipularea modulelor mici, pierderile mai mici si posibilitatea de interventie locala aduc avantaje reale.'
            },
            {
                title: 'Tigla metalica clasica',
                content: 'Tigla metalica clasica ramane una dintre cele mai eficiente solutii pentru acoperis in Moldova. Site-ul prezinta mai multe profile, precum Enigma, Eterna, Getica, Laguna, Optima si Regalis, cu accent pe greutate redusa, montaj eficient, rezistenta buna la intemperii si varietate de culori si finisaje.'
            },
            {
                title: 'Date utile pentru tigla metalica clasica',
                content: 'Pentru modelele de tigla metalica de pe site, panta minima este in general 14 - 15 grade, iar greutatea este aproximativ 3 - 5.5 kg pe metru patrat, in functie de profil. Aceasta o face mai usoara decat solutiile grele si potrivita pentru multe proiecte rezidentiale.'
            },
            {
                title: 'Diferenta intre tigla metalica modulara si clasica',
                content: 'Tigla modulara vine in module compacte si este mai convenabila la transport, manipulare, optimizarea pierderilor si reparatii locale. Tigla metalica clasica ramane o solutie foarte buna si populara, mai ales pe acoperisuri simple sau medii, unde continuitatea panourilor lungi poate fi avantajoasa.'
            },
            {
                title: 'Sindrila bituminoasa',
                content: 'Sindrila bituminoasa este o invelitoare premium pe baza de bitum modificat, armata cu fibra de sticla si protejata cu granule minerale. Pe site este prezentata ca o solutie eleganta, durabila si mult mai confortabila acustic decat multe acoperisuri metalice.'
            },
            {
                title: 'Cand recomanzi sindrila bituminoasa',
                content: 'Sindrila bituminoasa este foarte potrivita pentru acoperisuri cu geometrii complexe, cupole, turele, mansarde si multe detalii. Punctele sale forte sunt flexibilitatea, adaptarea buna la forme dificile, aspectul uniform si izolatia fonica mai buna la ploaie.'
            },
            {
                title: 'Date tehnice sindrila bituminoasa',
                content: 'Pe site apar repere precum 8 - 12 kg per metru patrat, comportament stabil intre aproximativ -30 si +110 grade, etanseitate ridicata si, pentru anumite game, pante minime incepand de la 9.5 grade sau 12 grade. Sunt mentionate si modele precum Cambridge Xtreme, Cambridge Xpress si Katepal.'
            },
            {
                title: 'Diferenta intre sindrila bituminoasa si tigla metalica',
                content: 'Sindrila bituminoasa este preferata cand conteaza flexibilitatea pe forme complicate si confortul acustic. Tigla metalica si tigla modulara sunt mai usoare, au montaj eficient si o logistica diferita. Alegerea corecta depinde de forma acoperisului, buget, preferinta estetica si sistemul complet dorit.'
            },
            {
                title: 'Tabla cutata',
                content: 'Tabla cutata din oferta MoldAcoperis nu trebuie recomandata automat pentru acoperisurile rezidentiale standard. Ea este mai potrivita pentru anexe, hale, proiecte tehnice, inchideri, garduri, streasini si alte aplicatii practice unde se cauta rigiditate, montaj rapid si eficienta.'
            },
            {
                title: 'Sistem de scurgere',
                content: 'Sistemul de scurgere are rolul de a proteja fatada, soclul, fundatia si zonele din jurul casei prin evacuarea controlata a apei. Pe site este prezentat ca un sistem complet, nu doar jgheab si burlan, ci si piese de legatura, coltare, coliere si accesorii compatibile.'
            },
            {
                title: 'Dimensiuni si materiale pentru sistemul de scurgere',
                content: 'Pe pagina de produs sunt prezentate variante precum 125/87 pentru case standard si 150/100 pentru suprafete mai mari, precum si materiale sau finisaje de tip Color, Zinc si Cupru. Alegerea depinde de suprafata acoperisului, lungimea streasinii si nivelul de finisaj dorit.'
            },
            {
                title: 'Accesorii de acoperis',
                content: 'Accesoriile de acoperis sunt esentiale pentru etansare, ventilare, coama, dolie, inchideri si finisaje. MoldAcoperis recomanda un sistem complet compatibil, nu selectarea pieselor doar dupa pret, pentru a evita incompatibilitati si improvizatii in santier.'
            },
            {
                title: 'Montaj acoperis',
                content: 'Pe site, montajul este prezentat ca parte dintr-un sistem complet: suport corect, folii, ventilare, accesorii, drenaj si executie buna. Chatul ar trebui sa explice ca montajul corect influenteaza durabilitatea, garantia si comportamentul final al acoperisului.'
            },
            {
                title: 'Reparatii si renovari',
                content: 'Pentru reparatii sau renovari conteaza daca exista infiltratii, foi deformate, suruburi slabite, probleme la coama, dolii sau sistemul de scurgere. Pentru recomandare exacta este utila evaluarea proiectului, fotografii si localitatea.'
            },
            {
                title: 'Garantie si durabilitate',
                content: 'Durabilitatea si garantia depind de grosimea metalului, zincare, tipul acoperirii de protectie si montajul corect. Chatul nu trebuie sa promita aceeasi garantie pentru toate produsele, ci sa explice ca garantia variaza in functie de sistem si acoperire.'
            },
            {
                title: 'Preturi si oferta',
                content: 'Pretul final depinde de produs, grosime, acoperire, suprafata, forma acoperisului, complexitate, accesorii si uneori montaj. Chiar daca pe unele pagini exista preturi orientative, recomandarea sigura este oferta personalizata, mai ales cand utilizatorul compara sisteme diferite.'
            },
            {
                title: 'Calculator si estimare',
                content: 'Site-ul MoldAcoperis include calculator sau configurator pentru estimari orientative. Pentru un pret final corect, chatul ar trebui sa recomande si o oferta personalizata, fiindca costul real depinde de mai multi factori tehnici si logistici.'
            },
            {
                title: 'Proces de ofertare',
                content: 'Cand utilizatorul cere oferta, datele utile sunt numele, telefonul, localitatea si tipul acoperisului sau produsul de interes. Daca are schita, suprafata, forma acoperisului sau fotografii, acestea ajuta echipa sa raspunda mai bine.'
            },
            {
                title: 'Livrare si logistica',
                content: 'Pentru produsele de acoperis conteaza si logistica. Tigla modulara are avantaj la transport compact si manipulare, iar sistemele complete cu accesorii si drenaj ajuta la o organizare mai coerenta a proiectului si la reducerea interventiilor ulterioare.'
            }
        ]
    },
    ru: {
        company: {
            name: 'MoldAcoperis',
            phone: '+373 79 360 360',
            email: 'moldacoperis@gmail.com',
            address: 'Calea Basarabiei 30, Chisinau',
            area: 'Кишинев и вся Молдова'
        },
        policies: commonPoliciesRu,
        topics: [
            {
                title: 'О MoldAcoperis',
                content: 'MoldAcoperis работает в Кишиневе и по всей Молдове, поставляет кровельные материалы, полные системы с аксессуарами и водостоком, а при необходимости помогает с расчетом, консультацией и обсуждением монтажа.'
            },
            {
                title: 'Модульная металлочерепица',
                content: 'Модульная металлочерепица входит в предложение MoldAcoperis и позиционируется как современное, премиальное и практичное решение. На сайте указаны преимущества: быстрый монтаж, компактная транспортировка, минимальные отходы, более легкий локальный ремонт и современный внешний вид. В линейке есть две эксклюзивные формы.'
            },
            {
                title: 'Технические данные модульной металлочерепицы',
                content: 'На странице продукта указаны такие ориентиры: толщина металла 0.45 - 0.50 мм, вес 4.8 - 5.2 кг на м2, минимальный уклон 14 градусов, цинковое покрытие 180 - 275 г на м2 и гарантия в диапазоне 30 - 50 лет в зависимости от покрытия.'
            },
            {
                title: 'Когда рекомендовать модульную металлочерепицу',
                content: 'Модульная металлочерепица особенно хорошо подходит для новых домов, замены старой кровли и сложной геометрии крыши, где важны удобство работы с модулями, меньшие отходы и более простой локальный ремонт.'
            },
            {
                title: 'Классическая металлочерепица',
                content: 'Классическая металлочерепица остается одним из основных кровельных решений MoldAcoperis. На сайте представлены профили Enigma, Eterna, Getica, Laguna, Optima и Regalis с акцентом на малый вес, удобный монтаж и широкий выбор визуальных стилей.'
            },
            {
                title: 'Разница между модульной и классической металлочерепицей',
                content: 'Модульная металлочерепица удобнее в транспортировке, раскладке на сложных крышах, оптимизации отходов и локальном ремонте. Классическая металлочерепица остается очень хорошим решением для многих домов, особенно если геометрия крыши проще и длинные листы работают эффективно.'
            },
            {
                title: 'Битумная черепица',
                content: 'Битумная черепица представлена как премиальный многослойный кровельный материал на основе модифицированного битума, стеклохолста и минеральной посыпки. Ее ценят за гибкость, аккуратный внешний вид и лучший акустический комфорт во время дождя.'
            },
            {
                title: 'Когда рекомендовать битумную черепицу',
                content: 'Битумная черепица особенно уместна на крышах со сложной геометрией, башенками, мансардными окнами, изгибами и большим количеством узлов. Ее сильные стороны - гибкость, ровный внешний вид и более тихое поведение под дождем по сравнению со многими металлическими системами.'
            },
            {
                title: 'Технические данные битумной черепицы',
                content: 'На сайте указаны такие ориентиры: около 8 - 12 кг на м2, высокая герметичность, стабильное поведение при перепадах температур и минимальный уклон от примерно 9.5 или 12 градусов в зависимости от серии.'
            },
            {
                title: 'Профнастил',
                content: 'Профнастил не следует продвигать как основное решение для стандартной жилой крыши, если есть более подходящие системы. Он лучше подходит для пристроек, ангаров, технических объектов, заборов, подшивки и других практических применений.'
            },
            {
                title: 'Водосточная система',
                content: 'Водосточная система защищает фасад, цоколь, фундамент и пространство вокруг дома за счет правильного отвода воды. MoldAcoperis подает ее как полноценную систему, а не только желоб и трубу, включая соединители, углы, хомуты и совместимые аксессуары.'
            },
            {
                title: 'Размеры и материалы водостока',
                content: 'На странице водостока показана логика размеров: 125/87 для стандартных домов и 150/100 для более крупных кровель, а также варианты Color, Zinc и Copper. Выбор зависит от площади крыши, длины карниза и требуемого уровня отделки.'
            },
            {
                title: 'Кровельные аксессуары',
                content: 'Кровельные аксессуары важны для герметизации, вентиляции, конька, ендовы и финишных узлов. MoldAcoperis рекомендует подбирать совместимую полную систему, а не отдельные элементы только по цене.'
            },
            {
                title: 'Монтаж кровли',
                content: 'Хороший монтаж понимается как полный системный подход: правильное основание, пленки, вентиляция, аксессуары, водосток и качественное исполнение. Качество монтажа влияет на долговечность, гарантию и поведение кровли в эксплуатации.'
            },
            {
                title: 'Ремонт и реконструкция',
                content: 'Для ремонта важны протечки, деформированные листы, ослабленные саморезы, проблемы на коньке, в ендовах или водостоке. Точная рекомендация зависит от оценки объекта, фотографий и населенного пункта.'
            },
            {
                title: 'Гарантия и долговечность',
                content: 'Гарантия и срок службы зависят от толщины металла, цинкового слоя, защитного покрытия и правильного монтажа. Ассистент должен объяснять, что гарантия различается по продуктам и покрытиям, а не одинакова для всех.'
            },
            {
                title: 'Цена и коммерческое предложение',
                content: 'Финальная цена зависит от типа продукта, толщины, покрытия, площади и формы крыши, аксессуаров и иногда монтажа. Даже если на некоторых страницах есть ориентировочные цены, самым надежным решением остается персональный расчет.'
            },
            {
                title: 'Калькулятор и оценка',
                content: 'На сайте есть калькулятор или конфигуратор для ориентировочной оценки. Для точной итоговой цены ассистент должен рекомендовать запрос предложения, потому что технические и логистические параметры все равно влияют на расчет.'
            },
            {
                title: 'Сбор заявки',
                content: 'Когда посетителю нужно предложение или обратный звонок, базовые данные - имя, телефон, населенный пункт и тип крыши либо нужный продукт. Дополнительные детали, например схема, площадь крыши или фотографии, помогают команде ответить точнее.'
            },
            {
                title: 'Логистика и практические преимущества',
                content: 'На выбор кровли влияют также транспортировка, удобство работы и объем отходов. Модульная металлочерепица выигрывает по логистике, а полные системы с аксессуарами и водостоком помогают лучше организовать проект и сократить последующие доработки.'
            }
        ]
    }
};

module.exports = {
    knowledgeBase
};
