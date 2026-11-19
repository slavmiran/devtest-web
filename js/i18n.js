(function () {
    'use strict';
    const ru = {
        skip:'Перейти к содержимому', navOptions:'Форматы тестирования', navAccount:'Кабинет',
        heroEyebrow:'ДЛЯ НЕЗАВИСИМЫХ ANDROID-РАЗРАБОТЧИКОВ', heroTitle:'Вы создаёте приложение.<br>Мы находим <span>тестировщиков.</span>',
        heroLead:'Закрытое тестирование Google Play с 12+ реальными людьми. Мы ведём 15-дневный цикл, пока вы работаете над своим приложением.',
        heroCta:'Заказать приватный тест', heroFree:'Бесплатное взаимное тестирование', heroNote:'От $20 за приложение · Разовая оплата · Без подписки',
        visualLabel:'ВАШ ЦИКЛ ЗАКРЫТОГО ТЕСТИРОВАНИЯ',visualTag:'Под нашим сопровождением',realTesters:'реальных тестировщиков',managedDays:'дней тестирования',cryptoPrice:'в криптовалюте',visualCaption:'Живые Android-устройства. Одна слаженная команда.',
        strip1:'Реальные устройства',strip2:'Без взаимных заданий',strip3:'Поддержка в Telegram',strip4:'Прогресс в Play Console',
        optionsEyebrow:'ДВА СПОСОБА ДВИГАТЬСЯ ВПЕРЁД',optionsTitle:'Ваше время. Ваш выбор.',optionsLead:'Присоединитесь к сообществу разработчиков или доверьте тест нам.',
        communityTag:'Сила сообщества',mutualTitle:'Взаимное тестирование',freePrice:'Бесплатно<span> · обменивайтесь временем</span>',
        mutualDescription:'Знакомьтесь с Android-разработчиками в Telegram. Тестируйте их приложения и находите тестировщиков для своего.',
        mutual1:'14-дневный цикл взаимного тестирования',mutual2:'Вы устанавливаете и тестируете чужие приложения',mutual3:'Проекты и ежедневные чекины в Telegram Mini App',openCommunity:'Открыть сообщество в Telegram',
        privateTag:'Ваш тест под ключ',privateTitle:'Приватное тестирование',perApp:' / приложение · в криптовалюте',
        privateDescription:'Выделенная команда и цикл с сопровождением. Не нужно тратить время на тестирование чужих приложений.',
        private1:'12+ реальных тестировщиков на живых Android-устройствах',private2:'15 дней закрытого тестирования с сопровождением',private3:'Помощь с заявкой на доступ к production',choosePrivate:'Выбрать приватный тест',feeNote:'PayPal / банк: $23 ($20 + комиссия $3).',
        processEyebrow:'ПОНЯТНЫЙ ПУТЬ К ВАШЕМУ РЕЛИЗУ',processTitle:'Настройте один раз. Продолжайте создавать.',
        process1Title:'Подготовьте приложение',process1:'Добавьте нашу Google-группу в Play Console, включите все страны и укажите ссылку на закрытый тест.',
        process2Title:'Мы организуем тест',process2:'12+ тестировщиков работают на реальных телефонах в течение 15 дней. Прогресс смотрите прямо в Play Console.',
        process3Title:'Подготовьтесь к production',process3:'Поможем подготовить заявку на доступ к production. Окончательное решение о допуске принимает Google.',
        orderEyebrow:'ВАШ СЛЕДУЮЩИЙ РЕЛИЗ НАЧИНАЕТСЯ ЗДЕСЬ',orderTitle:'Начнём тестировать ваше приложение.',orderLead:'Укажите приложение, проверьте настройки и выберите способ оплаты.',
        draftSaved:'Черновик сохранён на устройстве',stepApp:'Приложение',stepSetup:'Play Console',stepPayment:'Оплата',resumeDraft:'Сохранённый черновик готов. Проверьте данные и продолжите.',clearDraft:'Удалить черновик',
        appDetailsTitle:'Расскажите о приложении',fromProject:'Подставить свой проект',manualEntry:'Ввести вручную',appName:'Название приложения',appNameHelp:'Точно как в Google Play Console.',appType:'Тип приложения',freeApp:'Бесплатное',paidApp:'Платное',
        licenseTitle:'Настройка License Testing',licenseLead:'Разрешите тестировщикам установить платное приложение без покупки.',license1:'Откройте Settings → License testing в Play Console.',license2:'Выберите Google Groups и добавьте:',license3:'Оставьте <code>RESPOND_NORMALLY</code> и сохраните.',licenseConfirm:'Я настроил(а) License Testing для платного приложения.',showScreenshots:'Показать скриншоты настройки',copy:'Копировать',confirmDetails:'Подтверждаю, что название и тип приложения указаны верно.',
        setupTitle:'Подключите закрытое тестирование',testingLink:'Ссылка на тест или <span class="notranslate" translate="no">Package ID</span>',testingLinkHelp:'Вставьте ссылку «Join on Android», адрес из магазина или Package ID. Мы приведём её к нужному формату.',confirmLink:'Я проверил(а) Package ID и ссылку на тестирование.',
        checklistTitle:'Чек-лист Google Play Console',groupConfirm:'Google-группа DevTestHub добавлена в тестировщики.',countriesConfirm:'Включены все страны / регионы.',reviewConfirm:'Изменения отправлены на проверку.',
        closedGuide:'Как настроить закрытое тестирование',closedGuide1:'Откройте Closed testing → Testers. Выберите Google Groups и добавьте почту группы выше.',closedGuide2:'Включите все страны / регионы, чтобы тестировщики со всего мира могли подключиться.',closedGuide3:'Отправьте изменения на проверку. В разделе «How testers join your test» скопируйте ссылку «Join on Android».',openConsole:'Открыть Play Console',
        paymentTitle:'Выберите способ оплаты',loadingPrices:'Проверяем актуальные цены…',retry:'Повторить',bank:'Банк',selectExchange:'Выберите биржу',internalTransfer:'Отправьте внутренний перевод USDT внутри выбранной биржи. Это UID биржи, а не адрес блокчейн-кошелька.',openExchange:'Открыть биржу',
        paypalInstructions:'Оплатите $23 ($20 + комиссия $3), затем вернитесь и прикрепите чек.',payPaypal:'Оплатить $23 через PayPal',manualPaypal:'Хотите перевести вручную?',openPaypal:'Открыть PayPal',bankInstructions:'Менеджер пересчитает $23 в вашу валюту и пришлёт точную сумму и реквизиты в Telegram.',currency:'Валюта оплаты',bankName:'Ваш банк',personalAccount:'Оплачиваю с личного счёта',requestRequisites:'Запросить банковские реквизиты',openManager:'Написать @garantXchange',bankWaiting:'Когда получите реквизиты и оплатите, прикрепите чек ниже.',
        receiptLabel:'Чек об оплате',receiptHelp:'PNG, JPG или WebP · До 5 МБ. Выберите скриншот после перевода.',receiptPrivacy:'Чек отправляется в приватный раздел проверки оплаты.',loginBeforePayment:'Войдите через Telegram перед оплатой или отправкой заказа.',signIn:'Войти',paymentConfirm:'Я оплатил(а) полную сумму и прикрепил(а) соответствующий чек.',back:'Назад',continue:'Продолжить',
        oneApp:'Одно приложение. Полный цикл.',summaryTitle:'Больше времени на разработку.',summaryText:'Мы берём на себя команду тестировщиков. Вы сосредоточены на релизе.',summarySupport:'Поддержка от настройки до заявки на production',cryptoOr:' крипто / $23 PayPal или банк',googleDecision:'Решение о доступе к production и публикации принимает Google. Пароль от аккаунта не нужен.',questionsSupport:'Есть вопросы? Напишите в поддержку',
        accountEyebrow:'ВСЁ В ОДНОМ МЕСТЕ',accountTitle:'Ваш кабинет тестирования.',logout:'Выйти',loginTitle:'Войдите через Telegram',loginDescription:'Используйте свой Telegram-аккаунт, чтобы видеть заказы, проекты и баланс $BUST.',widgetHelp:'Если кнопка входа не появилась, разрешите telegram.org в браузере и попробуйте снова.',reloadLogin:'Обновить кнопку входа',refresh:'Обновить заказы',balance:'Ваш баланс',botReceipt:'Разрешите боту писать вам или откройте и запустите его, чтобы получать чеки в личные сообщения Telegram.',openBot:'Открыть бота для получения чека',activeOrders:'Активные заказы',
        comingSoon:'Скоро / Phase 2',bustTitle:'Больше возможностей с $BUST.',bustDescription:'Баланс платформы уже доступен в кабинете. Покупка пакетов $BUST на сайте появится на следующем этапе.',
        faqTitle:'Ответы на частые вопросы.',faq1q:'Что входит в приватное тестирование?',faq1a:'12+ реальных тестировщиков на физических Android-устройствах, 15-дневный цикл с сопровождением и помощь с заявкой на доступ к production. Тестировать чужие приложения не нужно.',faq2q:'Сколько это стоит?',faq2a:'Для одного приложения — $20 внутренним переводом на криптобирже или $23 через PayPal либо банк, включая комиссию $3.',faq3q:'Можно протестировать платное приложение?',faq3a:'Да. Добавьте <code>google-play-dev-test@googlegroups.com</code> в License testing в Google Play Console и оставьте <code>RESPOND_NORMALLY</code>, чтобы тестировщики могли установить приложение без покупки.',faq4q:'Гарантирует ли DevTestHub одобрение Google Play?',faq4a:'Окончательные решения о доступе к production и публикации принимает Google. DevTestHub организует тестирование и помогает с заявкой; тестирование не заменяет соблюдение правил Google Play.',faq5q:'Есть ли бесплатный вариант?',faq5a:'Да. Откройте @Android12TestersBot в Telegram и присоединитесь к взаимному тестированию: вы тестируете чужие приложения, а другие разработчики — ваше.',faq6q:'Где смотреть заказ и получить чек?',faq6a:'Войдите через Telegram, чтобы увидеть активные заказы на сайте. Разрешите сообщения от бота или запустите его для получения чека в личку. Банковские реквизиты можно получить у @garantXchange.',finalTitle:'Откройте следующую главу вашего приложения.',footerNote:'Для независимых разработчиков. Не связано с Google или Telegram.',support:'Поддержка',
        copied:'Скопировано',copyFailed:'Не удалось скопировать. Выделите и скопируйте значение вручную.',sessionExpired:'Сессия истекла. Войдите снова — черновик формы сохранён.',signedOut:'Вы вышли из аккаунта. Черновик сохранён.',loggingIn:'Проверяем вход через Telegram…',loadingAccount:'Загружаем кабинет…',accountUnavailable:'Не удалось загрузить кабинет. Повторите запрос — сохранённые заказы не потеряны.',loginFailed:'Не удалось войти. Повторите вход через Telegram. Если ошибка сохраняется, обратитесь в поддержку.',noOrders:'Пока нет активных заказов. Добавьте приложение в форме выше.',pricesReady:'Актуальные цены загружены. Итоговая сумма определяется сервером.',pricesUnavailable:'Не удалось проверить цены. Повторите запрос перед оплатой.',commerceDisabled:'Приём новых заказов временно недоступен. Обратитесь в поддержку.',processing:'Отправляем…',submitOrder:'Отправить заказ с чеком',missingDetails:'Укажите название и подтвердите данные приложения.',missingLicense:'Сначала настройте и подтвердите License Testing для платного приложения.',invalidLink:'Укажите корректный Package ID или HTTPS-ссылку play.google.com на приложение.',missingChecklist:'Проверьте ссылку и отметьте все пункты настройки Play Console.',missingReceipt:'Выберите чек PNG, JPG или WebP размером до 5 МБ.',missingPaymentConfirmation:'Подтвердите оплату и соответствие чека.',missingBank:'Выберите валюту и укажите свой банк.',bankFirst:'Сначала запросите реквизиты и оплатите перевод менеджеру.',needLogin:'Войдите через Telegram. Данные формы уже сохранены.',submitted:'Заказ {code} отправлен на проверку оплаты. Это ещё не подтверждение платежа.',requisitesCreated:'Заказ {code} создан. Откройте чат с менеджером для получения реквизитов.',networkError:'Не удалось получить ответ сервера. Данные сохранены. Обновите заказы перед повторной отправкой — запрос мог уже выполниться.',uploadError:'Не удалось загрузить чек. Попробуйте снова или обратитесь в поддержку.',duplicateOrder:'Для этого приложения уже есть активный заказ. Обновите кабинет и продолжите нужный заказ.',storageUnavailable:'Браузер запретил сохранение черновика. Не закрывайте вкладку до отправки.',draftReset:'Локальный черновик удалён. Существующие заказы сохранены в кабинете.',resumeOrder:'Прикрепить чек',cancelOrder:'Отменить заказ',confirmCancel:'Отменить этот неоплаченный заказ? Перевод денег это действие не возвращает.',orderCancelled:'Неоплаченный заказ отменён.',status_awaiting_payment:'Ожидаем оплату',status_pending:'Проверка оплаты',status_paid:'Подготовка команды',status_in_progress:'Тестирование идёт',status_completed:'Тестирование завершено',status_cancelled:'Отменён',status_unknown:'Статус уточняется',orderSupport:'Поддержка',bankBound:'Данные связаны с заказом. Чтобы заказать тест другого приложения, очистите локальный черновик.',translateLoading:'Загружаем Google Translate…',translateFailed:'Google Translate недоступен. Вы можете выбрать EN / RU или повторить позже.',bustEnabled:'Возможности $BUST обновлены. Узнайте доступные варианты в Telegram-боте.',authUnavailable:'Вход на сайте пока не настроен на сервере. Попробуйте позже или откройте Telegram-бот.',proofRetained:'Чек уже загружен в этой сессии. Повторно выберите файл, если хотите его заменить.'
    };
    const extraEn = {
        copied:'Copied',copyFailed:'Could not copy. Select and copy the value manually.',sessionExpired:'Your session expired. Sign in again — your form draft is saved.',signedOut:'You’re signed out. Your draft is saved.',loggingIn:'Verifying Telegram sign-in…',loadingAccount:'Loading your account…',accountUnavailable:'Your account could not be loaded. Try again — existing orders are still saved.',loginFailed:'Could not sign in. Try Telegram sign-in again. If this continues, contact support.',noOrders:'No active orders yet. Add your app in the form above.',pricesReady:'Current prices loaded. The server determines your final order amount.',pricesUnavailable:'Could not verify prices. Try again before paying.',commerceDisabled:'New orders are temporarily unavailable. Please contact support.',processing:'Submitting…',submitOrder:'Submit order with receipt',missingDetails:'Enter the app name and confirm your app details.',missingLicense:'Configure and confirm License Testing for your paid app first.',invalidLink:'Enter a valid Package ID or an HTTPS play.google.com app link.',missingChecklist:'Check your testing link and confirm every Play Console checklist item.',missingReceipt:'Choose a PNG, JPG or WebP receipt up to 5 MB.',missingPaymentConfirmation:'Confirm that you have paid and attached the matching receipt.',missingBank:'Choose your currency and enter your bank name.',bankFirst:'Request the bank payment details and pay the manager first.',needLogin:'Sign in with Telegram. Your form details are already saved.',submitted:'Order {code} submitted for payment review. This is not a payment confirmation yet.',requisitesCreated:'Order {code} created. Open the manager chat for your payment details.',networkError:'The server response was not received. Your draft is saved. Refresh your orders before retrying — the request may already have completed.',uploadError:'Your receipt could not be uploaded. Try again or contact support.',duplicateOrder:'There is already an active order for this app. Refresh your account and continue that order.',storageUnavailable:'Your browser blocked draft storage. Keep this tab open until you submit.',draftReset:'Local draft cleared. Existing orders remain in your account.',resumeOrder:'Attach receipt',cancelOrder:'Cancel order',confirmCancel:'Cancel this unpaid order? This action does not refund a transfer.',orderCancelled:'Unpaid order cancelled.',status_awaiting_payment:'Awaiting payment',status_pending:'Payment review',status_paid:'Preparing the team',status_in_progress:'Testing in progress',status_completed:'Testing completed',status_cancelled:'Cancelled',status_unknown:'Status being updated',orderSupport:'Support',bankBound:'These details belong to an existing order. Clear the local draft to order testing for another app.',translateLoading:'Loading Google Translate…',translateFailed:'Google Translate is unavailable. Choose EN / RU or try again later.',bustEnabled:'$BUST capabilities have been updated. Explore available options in the Telegram bot.',authUnavailable:'Website sign-in is not configured on the server yet. Please try later or open the Telegram bot.',proofRetained:'Your receipt is already uploaded in this session. Select a file again if you want to replace it.'
    };
    const en = {...extraEn};
    document.querySelectorAll('[data-i18n]').forEach(el => { if (!(el.dataset.i18n in en)) en[el.dataset.i18n] = el.innerHTML; });
    Object.assign(ru, {
        currentHeroPrice:'От ${crypto} за приложение · Разовая оплата · Без подписки',
        currentFee:'PayPal: ${paypal} · Банк: ${bank} (включая комиссию).',
        currentPaypal:'Оплатите ${paypal}, включая комиссию ${paypalFee}, затем вернитесь и прикрепите чек.',
        currentPaypalButton:'Оплатить ${paypal} через PayPal',
        currentBank:'Менеджер пересчитает ${bank} в вашу валюту и пришлёт точную сумму и реквизиты в Telegram.',
        currentSummary:' крипто / ${paypal} PayPal / ${bank} банк',
        currentFaqPrice:'Для одного приложения — ${crypto} внутренним переводом на криптобирже, ${paypal} через PayPal или ${bank} через банк. Комиссия включена.'
    });
    Object.assign(en, {
        currentHeroPrice:'From ${crypto} per app · One payment · No subscription',
        currentFee:'PayPal: ${paypal} · Bank: ${bank} (fees included).',
        currentPaypal:'Pay ${paypal}, including the ${paypalFee} processing fee, then return and attach your receipt.',
        currentPaypalButton:'Pay ${paypal} with PayPal',
        currentBank:'The manager converts ${bank} to your local currency and sends the exact amount and payment details in Telegram.',
        currentSummary:' crypto / ${paypal} PayPal / ${bank} bank',
        currentFaqPrice:'One app costs ${crypto} by internal crypto exchange transfer, ${paypal} with PayPal, or ${bank} by bank transfer. Processing fees are included.'
    });

    Object.assign(en, window.SiteCopy.en, window.FaqCopy.en);
    Object.assign(ru, window.SiteCopy.ru, window.FaqCopy.ru);
    let language = 'en';
    let selected = 'en';
    const catalog = window.SiteLanguages;
    const storageKey = 'dth.language';
    let translateScript;
    let toastTimer;
    let toastAction;
    function toast(message, {retry, persistent = false} = {}) {
        const el=document.getElementById('toast');
        document.getElementById('toast-message').textContent=message;
        toastAction=retry;
        document.getElementById('toast-retry').hidden=!retry;
        el.hidden=false;clearTimeout(toastTimer);
        if(!persistent)toastTimer=setTimeout(()=>{el.hidden=true;},7000);
    }
    document.getElementById('toast-retry').addEventListener('click',()=>{document.getElementById('toast').hidden=true;toastAction?.();});
    document.getElementById('toast-dismiss').addEventListener('click',()=>{document.getElementById('toast').hidden=true;clearTimeout(toastTimer);});
    function t(key, vars = {}) {
        let value=(language==='ru'?ru[key]:en[key])||en[key]||key;
        for(const [name,text] of Object.entries(vars))value=value.replaceAll('{'+name+'}',String(text));
        return value;
    }
    function apply() {
        document.documentElement.lang=selected;
        document.documentElement.dir=['ar','fa','he','ur'].includes(selected)?'rtl':'ltr';
        document.querySelectorAll('[data-i18n]').forEach(el=>{el.innerHTML=t(el.dataset.i18n);});
        document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.setAttribute('placeholder',t(el.dataset.i18nPlaceholder)));
        document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===selected)));
        document.getElementById('current-language').textContent=selected.toUpperCase();
        SiteUtils.protect();window.dispatchEvent(new Event('language-changed'));
    }
    function clearTranslateCookies() {
        const domains=['',location.hostname,'.'+location.hostname,'devtesthub.app','.devtesthub.app'];
        domains.forEach(domain=>{document.cookie='googtrans=;max-age=0;path=/;SameSite=Lax'+(domain?';domain='+domain:'');});
    }
    function googleCode(){return catalog.find(row=>row.code===selected)?.googleCode;}
    function enableGoogle() {
        toast(t('translateLoading'));
        if(!translateScript){
            translateScript=document.createElement('script');translateScript.async=true;
            translateScript.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            translateScript.onerror=()=>{translateScript.remove();translateScript=null;toast(t('translateFailed'),{retry:enableGoogle});};
            document.head.append(translateScript);
        }else applyGoogleSelection();
    }
    function applyGoogleSelection(attempt=0){
        if(!googleCode())return;
        const select=document.querySelector('.goog-te-combo');
        if(select){select.value=googleCode();select.dispatchEvent(new Event('change'));}
        else if(attempt<40)setTimeout(()=>applyGoogleSelection(attempt+1),250);
        else toast(t('translateFailed'),{retry:enableGoogle});
    }
    window.googleTranslateElementInit=function(){
        if(!window.google?.translate?.TranslateElement)return;
        new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:[...new Set(catalog.map(row=>row.googleCode))].join(','),autoDisplay:false},'google_translate_element');
        applyGoogleSelection();
    };
    function choose(next){
        if(!['en','ru'].includes(next)&&!catalog.some(row=>row.code===next))return;
        const hadGoogle=!['en','ru'].includes(selected)||document.cookie.includes('googtrans=');
        selected=next;language=next==='ru'?'ru':'en';
        try{localStorage.setItem(storageKey,next);}catch(_){}
        clearTranslateCookies();
        if(['en','ru'].includes(next)){
            if(hadGoogle){window.dispatchEvent(new Event('save-draft'));if(window.SiteDrawers?.active==='language')SiteDrawers.close({immediate:true});location.reload();return;}
        }else document.cookie='googtrans='+encodeURIComponent('/en/'+googleCode())+';path=/;max-age=31536000;SameSite=Lax';
        apply();if(window.SiteDrawers?.active==='language')SiteDrawers.close({immediate:true});if(googleCode())enableGoogle();
    }
    function renderLanguages(){
        const grid=document.getElementById('language-grid');grid.replaceChildren();
        const query=document.getElementById('language-search').value.toLocaleLowerCase().trim();
        catalog.filter(row=>[row.name,row.english,row.ruName,row.country,row.ruCountry,row.code,row.flag].join(' ').toLocaleLowerCase().includes(query)).forEach(row=>{
            const button=document.createElement('button');button.type='button';button.dataset.lang=row.code;
            button.setAttribute('aria-pressed',String(selected===row.code));
            const flag=document.createElement('span');flag.className='language-flag';flag.setAttribute('aria-hidden','true');
            const flagImage=document.createElement('img');flagImage.src='assets/flags/'+row.flag.toLowerCase()+'.svg';flagImage.alt='';flagImage.loading='lazy';flag.append(flagImage);
            const names=document.createElement('span'),name=document.createElement('strong'),english=document.createElement('small');
            name.textContent=row.name;english.textContent=row.english;names.append(name,english);button.append(flag,names);
            button.addEventListener('click',()=>choose(row.code));grid.append(button);
        });
        document.getElementById('language-empty').hidden=grid.childElementCount!==0;
    }
    window.SiteI18n={t,toast,apply,choose,get language(){return language;},get selected(){return selected;}};
    document.querySelectorAll('.native-languages [data-lang]').forEach(el=>el.addEventListener('click',()=>choose(el.dataset.lang)));
    document.getElementById('language-search').addEventListener('input',renderLanguages);
    let initial='en';try{initial=localStorage.getItem(storageKey)||'en';}catch(_){}
    initial=initial.toLowerCase();if(!['en','ru'].includes(initial)&&!catalog.some(row=>row.code===initial))initial='en';
    selected=initial;language=initial==='ru'?'ru':'en';
    renderLanguages();apply();if(googleCode())enableGoogle();
})();
