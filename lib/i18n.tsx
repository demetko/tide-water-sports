"use client";
import {createContext,useContext,useEffect,useState} from 'react';
export const languages={en:'English',bg:'Български',ro:'Română',de:'Deutsch',pl:'Polski',uk:'Українська'};
export type Lang=keyof typeof languages;
const codes=Object.keys(languages) as Lang[];
export const messages={
 "book": [
  "Book an experience",
  "Резервирайте преживяване",
  "Rezervă o experiență",
  "Erlebnis buchen",
  "Zarezerwuj atrakcję",
  "Забронювати враження"
 ],
 "vendor": [
  "Vendor console",
  "Конзола за оператори",
  "Panou operator",
  "Anbieterkonsole",
  "Panel operatora",
  "Панель оператора"
 ],
 "coast": [
  "BULGARIAN BLACK SEA COAST",
  "БЪЛГАРСКО ЧЕРНОМОРИЕ",
  "LITORALUL BULGĂRESC",
  "BULGARISCHE SCHWARZMEERKÜSTE",
  "BUŁGARSKIE WYBRZEŻE MORZA CZARNEGO",
  "БОЛГАРСЬКЕ УЗБЕРЕЖЖЯ ЧОРНОГО МОРЯ"
 ],
 "headline": [
  "Good days start on the water.",
  "Хубавите дни започват в морето.",
  "Zilele frumoase încep pe apă.",
  "Gute Tage beginnen auf dem Wasser.",
  "Dobre dni zaczynają się na wodzie.",
  "Гарні дні починаються на воді."
 ],
 "subtitle": [
  "Find your next adventure. We’ll take care of the rest.",
  "Открийте следващото си приключение. Ние ще се погрижим за останалото.",
  "Găsește următoarea aventură. Noi ne ocupăm de restul.",
  "Finde dein nächstes Abenteuer. Wir kümmern uns um den Rest.",
  "Znajdź kolejną przygodę. Resztą zajmiemy się my.",
  "Знайдіть наступну пригоду. Про решту подбаємо ми."
 ],
 "moreSea": [
  "MORE SEA.\nMORE YOU.",
  "ПОВЕЧЕ МОРЕ.\nПОВЕЧЕ ЗА ВАС.",
  "MAI MULTĂ MARE.\nMAI MULT TIMP.",
  "MEHR MEER.\nMEHR DU.",
  "WIĘCEJ MORZA.\nWIĘCEJ CIEBIE.",
  "БІЛЬШЕ МОРЯ.\nБІЛЬШЕ ДЛЯ ВАС."
 ],
 "departure": [
  "Your departure point",
  "Място на тръгване",
  "Locul de plecare",
  "Dein Abfahrtsort",
  "Miejsce wypłynięcia",
  "Місце відправлення"
 ],
 "day": [
  "Your day on the water",
  "Вашият ден в морето",
  "Ziua ta pe apă",
  "Dein Tag auf dem Wasser",
  "Twój dzień na wodzie",
  "Ваш день на воді"
 ],
 "local": [
  "Local operators. Unforgettable experiences.",
  "Местни оператори. Незабравими преживявания.",
  "Operatori locali. Experiențe de neuitat.",
  "Lokale Anbieter. Unvergessliche Erlebnisse.",
  "Lokalni operatorzy. Niezapomniane wrażenia.",
  "Місцеві оператори. Незабутні враження."
 ],
 "choose": [
  "Choose your kind of adventure",
  "Изберете вашето приключение",
  "Alege aventura ta",
  "Wähle dein Abenteuer",
  "Wybierz swoją przygodę",
  "Оберіть свою пригоду"
 ],
 "experiences": [
  "experiences",
  "преживявания",
  "experiențe",
  "Erlebnisse",
  "atrakcje",
  "враження"
 ],
 "jet": [
  "Jet ski adventure",
  "Приключение с джет",
  "Aventură cu jet ski",
  "Jetski-Abenteuer",
  "Przygoda na skuterze",
  "Пригода на гідроциклі"
 ],
 "para": [
  "Above the blue",
  "Над синевата",
  "Deasupra mării",
  "Über dem Blau",
  "Ponad błękitem",
  "Над блакиттю"
 ],
 "yacht": [
  "Your own slice of sea",
  "Вашето кътче море",
  "Marea doar pentru tine",
  "Dein Stück Meer",
  "Twój kawałek morza",
  "Ваш куточок моря"
 ],
 "jetType": [
  "Jet ski",
  "Джет",
  "Jet ski",
  "Jetski",
  "Skuter wodny",
  "Гідроцикл"
 ],
 "paraType": [
  "Parasailing tandem flight",
  "Полет с парасейлинг за двама",
  "Zbor tandem cu parasailing",
  "Parasailing-Tandemflug",
  "Lot tandemowy na parasailingu",
  "Тандемний політ на парасейлінгу"
 ],
 "yachtType": [
  "Yacht charter",
  "Наем на яхта",
  "Închiriere iaht",
  "Yachtcharter",
  "Czarter jachtu",
  "Оренда яхти"
 ],
 "jetTag": [
  "A LITTLE ADRENALINE",
  "МАЛКО АДРЕНАЛИН",
  "PUȚINĂ ADRENALINĂ",
  "EIN WENIG ADRENALIN",
  "ODROBINA ADRENALINY",
  "ТРОХИ АДРЕНАЛІНУ"
 ],
 "paraTag": [
  "A NEW PERSPECTIVE",
  "НОВА ПЕРСПЕКТИВА",
  "O NOUĂ PERSPECTIVĂ",
  "EINE NEUE PERSPEKTIVE",
  "NOWA PERSPEKTYWA",
  "НОВИЙ ПОГЛЯД"
 ],
 "yachtTag": [
  "TAKE IT SLOW",
  "БЕЗ БЪРЗАНЕ",
  "FĂRĂ GRABĂ",
  "GANZ ENTSPANNT",
  "BEZ POŚPIECHU",
  "БЕЗ ПОСПІХУ"
 ],
 "hours": [
  "hours",
  "часа",
  "ore",
  "Stunden",
  "godz.",
  "год."
 ],
 "hour": [
  "hour",
  "час",
  "oră",
  "Stunde",
  "godz.",
  "год."
 ],
 "available": [
  "available",
  "свободни",
  "disponibile",
  "verfügbar",
  "dostępne",
  "доступно"
 ],
 "capacity": [
  "fleet capacity",
  "общ капацитет",
  "capacitate flotă",
  "Flottenkapazität",
  "pojemność floty",
  "місткість флоту"
 ],
 "briefing": [
  "Safety briefing included",
  "Включен инструктаж",
  "Instructaj inclus",
  "Einweisung inklusive",
  "Instruktaż w cenie",
  "Інструктаж включено"
 ],
 "peace": [
  "Adventure, with peace of mind",
  "Приключение със спокойствие",
  "Aventură fără griji",
  "Abenteuer mit gutem Gefühl",
  "Przygoda ze spokojną głową",
  "Пригода зі спокоєм"
 ],
 "safety": [
  "Safety equipment & briefing included",
  "Екипировка и инструктаж включени",
  "Echipament de siguranță și instructaj incluse",
  "Sicherheitsausrüstung und Einweisung inklusive",
  "Sprzęt bezpieczeństwa i instruktaż w cenie",
  "Захисне спорядження й інструктаж включено"
 ],
 "people": [
  "People who know these waters",
  "Хора, които познават морето",
  "Oameni care cunosc aceste ape",
  "Menschen, die diese Gewässer kennen",
  "Ludzie, którzy znają te wody",
  "Люди, які знають ці води"
 ],
 "operators": [
  "Experienced local operators",
  "Опитни местни оператори",
  "Operatori locali cu experiență",
  "Erfahrene lokale Anbieter",
  "Doświadczeni lokalni operatorzy",
  "Досвідчені місцеві оператори"
 ],
 "weather": [
  "Weather on your side",
  "Съобразено с времето",
  "Ținem cont de vreme",
  "Das Wetter im Blick",
  "Pogoda pod kontrolą",
  "З урахуванням погоди"
 ],
 "refund": [
  "Full refund for unsafe sea conditions",
  "Пълно възстановяване при опасно море",
  "Rambursare integrală când marea este periculoasă",
  "Volle Erstattung bei unsicherem Seegang",
  "Pełny zwrot przy niebezpiecznych warunkach",
  "Повне повернення за небезпечного стану моря"
 ],
 "yourTime": [
  "Your time on the water",
  "Вашето време в морето",
  "Timpul tău pe apă",
  "Deine Zeit auf dem Wasser",
  "Twój czas na wodzie",
  "Ваш час на воді"
 ],
 "start": [
  "Start time",
  "Начален час",
  "Ora de început",
  "Startzeit",
  "Godzina rozpoczęcia",
  "Час початку"
 ],
 "duration": [
  "Duration",
  "Продължителност",
  "Durată",
  "Dauer",
  "Czas trwania",
  "Тривалість"
 ],
 "quantity": [
  "Equipment quantity",
  "Брой оборудване",
  "Număr de echipamente",
  "Anzahl der Einheiten",
  "Liczba jednostek",
  "Кількість спорядження"
 ],
 "rental": [
  "Equipment rental",
  "Наем на оборудване",
  "Închiriere echipament",
  "Ausrüstungsmiete",
  "Wynajem sprzętu",
  "Оренда спорядження"
 ],
 "included": [
  "Included",
  "Включено",
  "Inclus",
  "Inklusive",
  "W cenie",
  "Включено"
 ],
 "total": [
  "Total",
  "Общо",
  "Total",
  "Gesamt",
  "Razem",
  "Разом"
 ],
 "continue": [
  "Continue to booking",
  "Продължете към резервация",
  "Continuă rezervarea",
  "Weiter zur Buchung",
  "Przejdź do rezerwacji",
  "Перейти до бронювання"
 ],
 "secure": [
  "No charge until the next step",
  "Без плащане преди следващата стъпка",
  "Nicio plată până la pasul următor",
  "Keine Zahlung vor dem nächsten Schritt",
  "Płatność w następnym kroku",
  "Оплата на наступному кроці"
 ],
 "oneCoast": [
  "One coast. Endless possibilities.",
  "Едно крайбрежие. Безброй възможности.",
  "Un litoral. Posibilități nesfârșite.",
  "Eine Küste. Endlose Möglichkeiten.",
  "Jedno wybrzeże. Nieskończone możliwości.",
  "Одне узбережжя. Безліч можливостей."
 ],
 "sunny": [
  "Sunny Beach",
  "Слънчев бряг",
  "Sunny Beach",
  "Sonnenstrand",
  "Słoneczny Brzeg",
  "Сонячний берег"
 ],
 "nessebar": [
  "Nessebar",
  "Несебър",
  "Nessebar",
  "Nessebar",
  "Nesebyr",
  "Несебр"
 ],
 "burgas": [
  "Burgas Marina",
  "Марина Бургас",
  "Marina Burgas",
  "Burgas Marina",
  "Marina Burgas",
  "Марина Бургас"
 ],
 "made": [
  "Made for days by the sea.",
  "За дните край морето.",
  "Pentru zilele la mare.",
  "Für Tage am Meer.",
  "Na dni nad morzem.",
  "Для днів біля моря."
 ],
 "terms": [
  "Terms & safety waiver",
  "Условия и декларация за безопасност",
  "Termeni și acord de siguranță",
  "Bedingungen und Sicherheitserklärung",
  "Warunki i oświadczenie bezpieczeństwa",
  "Умови й декларація безпеки"
 ],
 "privacy": [
  "Privacy policy",
  "Политика за поверителност",
  "Politica de confidențialitate",
  "Datenschutzerklärung",
  "Polityka prywatności",
  "Політика конфіденційності"
 ],
 "checkout": [
  "Make it a sea day",
  "Подарете си морски ден",
  "Alege o zi pe mare",
  "Mach einen Meerestag daraus",
  "Zaplanuj dzień na morzu",
  "Влаштуйте день на морі"
 ],
 "test": [
  "Test checkout — no real charge. Use the sample card below.",
  "Тестово плащане — без реално таксуване. Използвайте примерната карта.",
  "Plată de test — fără debitare reală. Folosește cardul de mai jos.",
  "Testzahlung — keine echte Belastung. Nutze die Beispielkarte unten.",
  "Płatność testowa — bez prawdziwego obciążenia. Użyj karty poniżej.",
  "Тестова оплата — без реального списання. Використайте зразок картки."
 ],
 "name": [
  "Full name",
  "Име и фамилия",
  "Nume complet",
  "Vollständiger Name",
  "Imię i nazwisko",
  "Повне ім’я"
 ],
 "phone": [
  "Phone number",
  "Телефонен номер",
  "Număr de telefon",
  "Telefonnummer",
  "Numer telefonu",
  "Номер телефону"
 ],
 "card": [
  "Test card number",
  "Номер на тестова карта",
  "Număr card de test",
  "Testkartennummer",
  "Numer karty testowej",
  "Номер тестової картки"
 ],
 "expiry": [
  "Expiry (MM/YY)",
  "Валидност (ММ/ГГ)",
  "Expirare (LL/AA)",
  "Gültig bis (MM/JJ)",
  "Ważność (MM/RR)",
  "Термін (ММ/РР)"
 ],
 "cvc": [
  "Security code",
  "Код за сигурност",
  "Cod de securitate",
  "Sicherheitscode",
  "Kod bezpieczeństwa",
  "Код безпеки"
 ],
 "agree": [
  "I accept the terms and safety waiver, confirm the age requirements, and have read the privacy policy.",
  "Приемам условията и декларацията за безопасност, потвърждавам изискванията за възраст и прочетох политиката за поверителност.",
  "Accept termenii și acordul de siguranță, confirm cerințele de vârstă și am citit politica de confidențialitate.",
  "Ich akzeptiere die Bedingungen und Sicherheitserklärung, erfülle die Altersanforderungen und habe die Datenschutzerklärung gelesen.",
  "Akceptuję warunki i oświadczenie bezpieczeństwa, potwierdzam wymagania wiekowe i zapoznanie się z polityką prywatności.",
  "Приймаю умови й декларацію безпеки, підтверджую вікові вимоги та ознайомлення з політикою конфіденційності."
 ],
 "pay": [
  "Pay now",
  "Платете сега",
  "Plătește acum",
  "Jetzt bezahlen",
  "Zapłać teraz",
  "Сплатити зараз"
 ],
 "paying": [
  "Confirming your booking…",
  "Потвърждаваме резервацията…",
  "Confirmăm rezervarea…",
  "Buchung wird bestätigt…",
  "Potwierdzamy rezerwację…",
  "Підтверджуємо бронювання…"
 ],
 "success": [
  "Your adventure is booked.",
  "Вашето приключение е резервирано.",
  "Aventura ta este rezervată.",
  "Dein Abenteuer ist gebucht.",
  "Twoja przygoda jest zarezerwowana.",
  "Вашу пригоду заброньовано."
 ],
 "confirmation": [
  "Booking reference",
  "Номер на резервация",
  "Referință rezervare",
  "Buchungsnummer",
  "Numer rezerwacji",
  "Номер бронювання"
 ],
 "arrival": [
  "Arrive 15 minutes early for your safety briefing.",
  "Елате 15 минути по-рано за инструктаж.",
  "Vino cu 15 minute înainte pentru instructaj.",
  "Komme 15 Minuten früher zur Sicherheitseinweisung.",
  "Przyjdź 15 minut wcześniej na instruktaż.",
  "Приходьте на 15 хвилин раніше для інструктажу."
 ],
 "done": [
  "Back to the coast",
  "Към крайбрежието",
  "Înapoi la litoral",
  "Zurück zur Küste",
  "Wróć na wybrzeże",
  "Назад до узбережжя"
 ],
 "close": [
  "Close",
  "Затвори",
  "Închide",
  "Schließen",
  "Zamknij",
  "Закрити"
 ],
 "loading": [
  "Checking availability…",
  "Проверка за наличности…",
  "Verificăm disponibilitatea…",
  "Verfügbarkeit wird geprüft…",
  "Sprawdzamy dostępność…",
  "Перевіряємо наявність…"
 ],
 "unavailable": [
  "Live availability is temporarily unavailable. Please try again.",
  "Наличностите временно не са достъпни. Опитайте отново.",
  "Disponibilitatea nu poate fi verificată momentan. Încearcă din nou.",
  "Die Verfügbarkeit ist vorübergehend nicht abrufbar. Bitte erneut versuchen.",
  "Dostępność jest chwilowo niedostępna. Spróbuj ponownie.",
  "Перевірка наявності тимчасово недоступна. Спробуйте ще раз."
 ],
 "retry": [
  "Try again",
  "Опитайте отново",
  "Încearcă din nou",
  "Erneut versuchen",
  "Spróbuj ponownie",
  "Спробувати ще раз"
 ],
 "soldout": [
  "Not enough equipment for this slot. Choose another time or quantity.",
  "Недостатъчно оборудване за този час. Изберете друг час или брой.",
  "Echipament insuficient. Alege altă oră sau cantitate.",
  "Nicht genug Ausrüstung für diesen Zeitraum. Wähle eine andere Zeit oder Anzahl.",
  "Za mało sprzętu. Wybierz inną godzinę lub liczbę.",
  "Недостатньо спорядження. Оберіть інший час або кількість."
 ],
 "past": [
  "Choose a future time. All times are local to Bulgaria.",
  "Изберете бъдещ час. Всички часове са местни за България.",
  "Alege o oră viitoare. Toate orele sunt locale în Bulgaria.",
  "Wähle eine zukünftige Uhrzeit. Alle Zeiten sind bulgarische Ortszeit.",
  "Wybierz przyszłą godzinę. Obowiązuje czas lokalny w Bułgarii.",
  "Оберіть майбутній час. Усі години — за місцевим часом Болгарії."
 ],
 "changed": [
  "The price changed. Refresh availability and try again.",
  "Цената е променена. Обновете наличностите и опитайте пак.",
  "Prețul s-a schimbat. Actualizează disponibilitatea și încearcă din nou.",
  "Der Preis hat sich geändert. Verfügbarkeit aktualisieren und erneut versuchen.",
  "Cena się zmieniła. Odśwież dostępność i spróbuj ponownie.",
  "Ціна змінилася. Оновіть наявність і спробуйте ще раз."
 ],
 "invalid": [
  "Check your details and use the test card 4242 4242 4242 4242.",
  "Проверете данните и използвайте тестовата карта 4242 4242 4242 4242.",
  "Verifică datele și folosește cardul de test 4242 4242 4242 4242.",
  "Prüfe deine Angaben und nutze die Testkarte 4242 4242 4242 4242.",
  "Sprawdź dane i użyj karty testowej 4242 4242 4242 4242.",
  "Перевірте дані та використайте тестову картку 4242 4242 4242 4242."
 ],
 "localTime": [
  "All times: Bulgaria · BGN pricing",
  "Местно време: България · Цени в BGN",
  "Ora Bulgariei · Prețuri în BGN",
  "Bulgarische Ortszeit · Preise in BGN",
  "Czas bułgarski · Ceny w BGN",
  "Час Болгарії · Ціни в BGN"
 ],
 "staffTitle": [
  "A clear view of your day.",
  "Ясен поглед към деня.",
  "O imagine clară a zilei.",
  "Dein Tag im Überblick.",
  "Twój dzień pod kontrolą.",
  "Ваш день під контролем."
 ],
 "staffIntro": [
  "Manage departures, track your fleet, and keep the good days flowing.",
  "Управлявайте тръгванията и следете оборудването.",
  "Gestionează plecările și urmărește flota.",
  "Verwalte Abfahrten und behalte deine Flotte im Blick.",
  "Zarządzaj wypłynięciami i śledź flotę.",
  "Керуйте відправленнями та стежте за флотом."
 ],
 "signin": [
  "Staff sign in",
  "Вход за персонал",
  "Autentificare personal",
  "Mitarbeiteranmeldung",
  "Logowanie personelu",
  "Вхід для персоналу"
 ],
 "staffOnly": [
  "This console is reserved for authorized rental staff.",
  "Тази конзола е само за оторизиран персонал.",
  "Acest panou este doar pentru personal autorizat.",
  "Diese Konsole ist autorisiertem Personal vorbehalten.",
  "Ten panel jest dostępny tylko dla upoważnionego personelu.",
  "Ця панель призначена лише для уповноваженого персоналу."
 ],
 "email": [
  "Email",
  "Имейл",
  "E-mail",
  "E-Mail",
  "E-mail",
  "Електронна пошта"
 ],
 "password": [
  "Password",
  "Парола",
  "Parolă",
  "Passwort",
  "Hasło",
  "Пароль"
 ],
 "signout": [
  "Sign out",
  "Изход",
  "Deconectare",
  "Abmelden",
  "Wyloguj",
  "Вийти"
 ],
 "authError": [
  "Sign-in failed or staff access has not been granted.",
  "Неуспешен вход или липсва достъп за персонал.",
  "Autentificare eșuată sau accesul nu a fost acordat.",
  "Anmeldung fehlgeschlagen oder Mitarbeiterzugriff fehlt.",
  "Logowanie nieudane lub brak uprawnień personelu.",
  "Не вдалося ввійти або немає доступу персоналу."
 ],
 "bookings": [
  "Bookings",
  "Резервации",
  "Rezervări",
  "Buchungen",
  "Rezerwacje",
  "Бронювання"
 ],
 "active": [
  "On the water",
  "В морето",
  "Pe apă",
  "Auf dem Wasser",
  "Na wodzie",
  "На воді"
 ],
 "revenue": [
  "Paid bookings",
  "Платени резервации",
  "Rezervări plătite",
  "Bezahlte Buchungen",
  "Opłacone rezerwacje",
  "Оплачені бронювання"
 ],
 "horizon": [
  "Daily horizon",
  "Дневен график",
  "Programul zilei",
  "Tagesübersicht",
  "Harmonogram dnia",
  "Розклад дня"
 ],
 "timeline": [
  "Fleet allocations, hour by hour",
  "Заетост на оборудването по часове",
  "Alocarea flotei, oră cu oră",
  "Flottenbelegung, Stunde für Stunde",
  "Wykorzystanie floty, godzina po godzinie",
  "Зайнятість флоту за годинами"
 ],
 "guest": [
  "Guest",
  "Гост",
  "Oaspete",
  "Gast",
  "Gość",
  "Гість"
 ],
 "experience": [
  "Experience",
  "Преживяване",
  "Experiență",
  "Erlebnis",
  "Atrakcja",
  "Враження"
 ],
 "status": [
  "Status",
  "Статус",
  "Stare",
  "Status",
  "Status",
  "Статус"
 ],
 "actions": [
  "Actions",
  "Действия",
  "Acțiuni",
  "Aktionen",
  "Działania",
  "Дії"
 ],
 "startRental": [
  "Start rental",
  "Начало на наема",
  "Începe închirierea",
  "Miete starten",
  "Rozpocznij wynajem",
  "Почати оренду"
 ],
 "returnRental": [
  "Complete & return",
  "Приключване и връщане",
  "Finalizează și returnează",
  "Abschließen und zurückgeben",
  "Zakończ i zwróć",
  "Завершити й повернути"
 ],
 "Reserved": [
  "Reserved",
  "Резервирано",
  "Rezervat",
  "Reserviert",
  "Zarezerwowane",
  "Зарезервовано"
 ],
 "Active": [
  "Active",
  "Активно",
  "Activ",
  "Aktiv",
  "Aktywne",
  "Активно"
 ],
 "Completed": [
  "Completed",
  "Приключено",
  "Finalizat",
  "Abgeschlossen",
  "Zakończone",
  "Завершено"
 ],
 "No-Show": [
  "No-show",
  "Неявяване",
  "Neprezentare",
  "Nicht erschienen",
  "Nieobecność",
  "Неявка"
 ],
 "Cancelled": [
  "Cancelled",
  "Отменено",
  "Anulat",
  "Storniert",
  "Anulowane",
  "Скасовано"
 ],
 "Paid": [
  "Paid",
  "Платено",
  "Plătit",
  "Bezahlt",
  "Opłacone",
  "Сплачено"
 ],
 "Pending": [
  "Pending",
  "Изчакване",
  "În așteptare",
  "Ausstehend",
  "Oczekujące",
  "Очікується"
 ],
 "Refunded": [
  "Refunded",
  "Възстановено",
  "Rambursat",
  "Erstattet",
  "Zwrócone",
  "Повернено"
 ],
 "empty": [
  "No bookings for this day.",
  "Няма резервации за този ден.",
  "Nu există rezervări pentru această zi.",
  "Keine Buchungen für diesen Tag.",
  "Brak rezerwacji na ten dzień.",
  "На цей день немає бронювань."
 ],
 "emptyHint": [
  "New bookings will appear here automatically.",
  "Новите резервации ще се появят автоматично.",
  "Rezervările noi vor apărea automat aici.",
  "Neue Buchungen erscheinen hier automatisch.",
  "Nowe rezerwacje pojawią się automatycznie.",
  "Нові бронювання з’являться автоматично."
 ],
 "session": [
  "Your session expired. Please sign in again.",
  "Сесията изтече. Влезте отново.",
  "Sesiunea a expirat. Autentifică-te din nou.",
  "Deine Sitzung ist abgelaufen. Bitte erneut anmelden.",
  "Sesja wygasła. Zaloguj się ponownie.",
  "Сеанс завершився. Увійдіть знову."
 ],
 "transition": [
  "This rental cannot change status yet. Refresh the day.",
  "Статусът още не може да се промени. Обновете графика.",
  "Starea nu poate fi schimbată încă. Actualizează programul.",
  "Der Status kann noch nicht geändert werden. Tagesansicht aktualisieren.",
  "Nie można jeszcze zmienić statusu. Odśwież harmonogram.",
  "Статус поки неможливо змінити. Оновіть розклад."
 ],
 "back": [
  "Back to experiences",
  "Към преживяванията",
  "Înapoi la experiențe",
  "Zurück zu den Erlebnissen",
  "Wróć do atrakcji",
  "Назад до вражень"
 ],
 "legalNote": [
  "Operator review required before accepting real bookings.",
  "Необходим е преглед от оператора преди реални резервации.",
  "Revizuirea operatorului este necesară înainte de rezervări reale.",
  "Vor echten Buchungen ist eine Prüfung durch den Betreiber erforderlich.",
  "Przed rzeczywistymi rezerwacjami wymagana jest weryfikacja operatora.",
  "Перед реальними бронюваннями потрібен перегляд оператором."
 ]
};
export type Key=keyof typeof messages;
const Context=createContext({lang:'en' as Lang,setLang:(_lang:Lang)=>{},t:(key:Key):string=>messages[key][0]});
export function I18n({children}:{children:React.ReactNode}){
 const [lang,setLanguage]=useState<Lang>('en');
 useEffect(()=>{const saved=localStorage.getItem('tide-language');if(saved&&saved in languages)setLanguage(saved as Lang)},[]);
 function setLang(l:Lang){setLanguage(l);localStorage.setItem('tide-language',l);}
 useEffect(()=>{document.documentElement.lang=lang},[lang]);
 return <Context.Provider value={{lang,setLang,t:key=>messages[key][codes.indexOf(lang)]}}>{children}</Context.Provider>;
}
export const useI18n=()=>useContext(Context);

