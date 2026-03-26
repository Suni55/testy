// ─── SUGESTIE PRZEPISÓW ────────────────────────────────────
    let currentSuggestions = [];

    function getSuggestions() {
        const now = Date.now();
        const DAY_MS = 86400000;
        const usedInPlan = new Set(Object.values(currentPlan).filter(Boolean));

        // Kategorie przepisów
        const neverUsed   = [];  // Nigdy nie użyte
        const longAgo     = [];  // Nie używane > 14 dni

        PRZEPISY_DATA.przepisy.forEach(name => {
            if (usedInPlan.has(name)) return; // Pomijaj już zaplanowane
            const lastUsed = recipeHistory[name];
            if (!lastUsed) {
                neverUsed.push(name);
            } else {
                const daysAgo = Math.floor((now - lastUsed) / DAY_MS);
                if (daysAgo >= 14) longAgo.push({ name, daysAgo });
            }
        });

        // Posortuj longAgo od najdawniejszego
        longAgo.sort((a, b) => b.daysAgo - a.daysAgo);

        const suggestions = [];

        // Dodaj 2 dawno nieużywane (jeśli są)
        longAgo.slice(0, 2).forEach(r => {
            suggestions.push({ name: r.name, type: 'long', daysAgo: r.daysAgo });
        });

        // Uzupełnij nigdy nieużywanymi
        const shuffledNever = neverUsed.sort(() => Math.random() - 0.5);
        shuffledNever.slice(0, Math.max(0, 4 - suggestions.length)).forEach(name => {
            suggestions.push({ name, type: 'never' });
        });

        // Jeśli nadal mało - losowe z puli
        if (suggestions.length < 4) {
            const others = PRZEPISY_DATA.przepisy
                .filter(n => !usedInPlan.has(n) && !suggestions.find(s => s.name === n))
                .sort(() => Math.random() - 0.5);
            others.slice(0, 4 - suggestions.length).forEach(name => {
                const lastUsed = recipeHistory[name];
                const daysAgo = lastUsed ? Math.floor((now - lastUsed) / DAY_MS) : null;
                suggestions.push({ name, type: 'random', daysAgo });
            });
        }

        return suggestions.slice(0, 4);
    }

    function refreshSuggestions() {
        currentSuggestions = getSuggestions();
        renderSuggestionsSection();
    }

    function renderSuggestionsSection() {
        const el = document.getElementById('suggestions-container');
        if (!el || !currentSuggestions.length) return;

        const badgeMap = {
            long:   { cls: 'badge-long',   icon: '⏰', label: s => `${s.daysAgo} dni temu` },
            never:  { cls: 'badge-never',  icon: '✨', label: () => 'Nigdy nie używany' },
            random: { cls: 'badge-random', icon: '🎲', label: s => s.daysAgo ? `${s.daysAgo} dni temu` : 'Wypróbuj!' }
        };

        el.innerHTML = `
            <div class="suggestions-section">
                <div class="suggestions-title">
                    💡 Zapomniane przepisy
                    <button class="suggestions-refresh" onclick="refreshSuggestions()">↻ Odśwież</button>
                </div>
                <div class="suggestions-grid">
                    ${currentSuggestions.map(s => {
                        const b = badgeMap[s.type];
                        return `<div class="suggestion-card" onclick="goToRecipe('${s.name.replace(/'/g, "\\'")}')">
                            <div class="suggestion-badge ${b.cls}">${b.icon} ${b.label(s)}</div>
                            <div class="suggestion-name">${s.name}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    }

    // ─── WŁASNE PRODUKTY ───────────────────────────────────────
    function addCustomProduct() {
        const inp = document.getElementById('custom-product-input');
        const name = inp.value.trim();
        if (!name) return;
        customProducts.push({ id: Date.now(), name, checked: false });
        saveCustomProducts(customProducts);
        inp.value = '';
        inp.focus();
        updateShoppingList();
    }

    function toggleCustomProduct(id) {
        const p = customProducts.find(p => p.id === id);
        if (p) { p.checked = !p.checked; saveCustomProducts(customProducts); updateShoppingList(); }
    }

    function deleteCustomProduct(id) {
        customProducts = customProducts.filter(p => p.id !== id);
        saveCustomProducts(customProducts);
        updateShoppingList();
    }

    // ─── DARK MODE ─────────────────────────────────────────────
    function initDarkMode() {
        const saved = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = saved !== null ? saved === 'true' : prefersDark;
        if (isDark) applyDark(true, false);
    }
    function applyDark(on, save = true) {
        document.body.classList.toggle('dark', on);
        document.getElementById('dark-btn').textContent = on ? '☀️' : '🌙';
        if (save) localStorage.setItem('darkMode', on);
    }
    function toggleDarkMode() {
        const isDark = document.body.classList.contains('dark');
        applyDark(!isDark);
    }

    // ─── NAWIGACJA TYGODNIA ────────────────────────────────────

// ─── INIT ──────────────────────────────────────────────────
    // Jednorazowe czyszczenie starych danych synchronizacji
    if (localStorage.getItem('syncCode')) {
        localStorage.removeItem('syncCode');
        localStorage.removeItem('syncRole');
    }
    
    initDarkMode();
    initNotifications();
    updateRecipeHistory(currentPlan);
    restoreCustomRecipes();
    renderToday();
    renderCalendar();
    // Ustaw domyślny zakres zakupów po załadowaniu DOM
    setTimeout(initShopDates, 100);
    // Uruchom synchronizację jeśli para już skonfigurowana
    setTimeout(initSync, 300);
