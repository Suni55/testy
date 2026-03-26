// ─── KONFIGURACJA I STORAGE ─────────────────────────────────
// Stałe i inicjalizacja localStorage

    const DAYS = [
        {id:'mon',name:'Poniedziałek'},{id:'tue',name:'Wtorek'},{id:'wed',name:'Środa'},
        {id:'thu',name:'Czwartek'},{id:'fri',name:'Piątek'},{id:'sat',name:'Sobota'},{id:'sun',name:'Niedziela'}
    ];
    const MEALS = [
        {id:'breakfast',name:'Śniadanie'},{id:'lunch',name:'Obiad'},{id:'dinner',name:'Kolacja'}
    ];
    const UNIT_CONVERSIONS = {
        'banan': {grams:120,unit:'szt'}, 'jabłko': {grams:150,unit:'szt'}, 'gruszka': {grams:130,unit:'szt'},
        'papryka czerwona': {grams:170,unit:'szt'}, 'ogórek świeży': {grams:150,unit:'szt'},
        'cebula': {grams:80,unit:'szt'}, 'pomidor': {grams:160,unit:'szt'}, 'cukinia': {grams:200,unit:'szt'},
        'ser twarogowy': {grams:275,unit:'opak.'}, 'serek wiejski bez laktozy': {grams:200,unit:'opak.'},
        'jogurt skyr bez laktozy': {grams:140,unit:'opak.'}, 'tuńczyk w sosie własnym': {grams:120,unit:'opak.'},
        'tofu naturalne': {grams:180,unit:'opak.'}, 'tofu wędzone': {grams:180,unit:'opak.'}
    };

// ─── STORAGE ───────────────────────────────────────────────
    const DATA_VERSION = '2';
    if (localStorage.getItem('dataVersion') !== DATA_VERSION) {
        // Nowa wersja danych - wyczyść stary plan i przeliczenia
        localStorage.removeItem('mealPlan');
        localStorage.removeItem('checkedItems');
        localStorage.removeItem('ownedAmounts');
        localStorage.removeItem('previousWeekPlan');
        localStorage.setItem('dataVersion', DATA_VERSION);
    }

    let currentPlan    = JSON.parse(localStorage.getItem('mealPlan')      || '{}');
    let checkedItems   = JSON.parse(localStorage.getItem('checkedItems')   || '[]');
    let ownedAmounts   = JSON.parse(localStorage.getItem('ownedAmounts')   || '{}');
    let customProducts = JSON.parse(localStorage.getItem('customProducts') || '[]');
    let recipeHistory  = JSON.parse(localStorage.getItem('recipeHistory')  || '{}');
    let favorites      = JSON.parse(localStorage.getItem('favorites')      || '[]');
    // recipeHistory: { recipeName: lastUsedTimestamp }

    function savePlan(plan, changedKey) {
        localStorage.setItem('mealPlan', JSON.stringify(plan));
        updateRecipeHistory(plan);
        updateShoppingList();
        // Sync do Supabase
        if (!isSyncing && syncPairId && changedKey) {
            const parts = changedKey.split('-');
            const person = parts.pop();
            const mealId = parts.pop();
            const dayKey = parts.join('-');
            pushPlanEntry(dayKey, mealId, person, plan[changedKey] || null);
        }
    }
    function saveCheckedItems(arr, changedKey, checked) {
        localStorage.setItem('checkedItems', JSON.stringify(arr));
        // Sync do Supabase
        if (!isSyncing && syncPairId && changedKey !== undefined) {
            pushCheckedItem(changedKey, checked);
        }
    }
    function saveOwnedAmounts(obj)   { localStorage.setItem('ownedAmounts',   JSON.stringify(obj)); }
    function saveCustomProducts(arr) { localStorage.setItem('customProducts', JSON.stringify(arr)); }
    function saveRecipeHistory(obj)  { localStorage.setItem('recipeHistory',  JSON.stringify(obj)); }
    function saveFavorites(arr)      { localStorage.setItem('favorites',      JSON.stringify(arr)); }

    // Aktualizuj historię gdy plan się zmienia
    function updateRecipeHistory(plan) {
        const now = Date.now();
        Object.values(plan).forEach(name => {
            if (name) recipeHistory[name] = now;
        });
        saveRecipeHistory(recipeHistory);
    }
