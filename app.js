import { db } from './firebase-config.js';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('from-currency');
const toSelect = document.getElementById('to-currency');
const convertBtn = document.getElementById('convert-btn');
const swapBtn = document.getElementById('swap-currencies');
const convertedText = document.getElementById('converted-amount');
const rateInfo = document.getElementById('rate-info');
const historyList = document.getElementById('history-list');
const baseSymbol = document.getElementById('base-symbol');

const currencySymbols = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$", INR: "₹", 
    AED: "د.إ", CNY: "¥", SGD: "S$"
};

const exchangeRates = {
    USD: 1.0,
    EUR: 0.94,
    GBP: 0.81,
    JPY: 154.50,
    INR: 83.50,
    AUD: 1.55,
    CAD: 1.37,
    AED: 3.67,
    CNY: 7.24,
    SGD: 1.36
};

const currencies = Object.keys(exchangeRates);

// Initialize dropdowns
function init() {
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    currencies.forEach(currency => {
        const opt1 = document.createElement('option');
        opt1.value = currency;
        opt1.textContent = currency;
        if (currency === 'INR') opt1.selected = true;
        fromSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = currency;
        opt2.textContent = currency;
        if (currency === 'USD') opt2.selected = true;
        toSelect.appendChild(opt2);
    });

    updateSymbol();
    loadHistory();
}

function updateSymbol() {
    const from = fromSelect.value;
    baseSymbol.textContent = currencySymbols[from] || "$";
}

async function convert() {
    const from = fromSelect.value;
    const to = toSelect.value;
    const amount = amountInput.value;

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    convertBtn.textContent = "Converting...";
    convertBtn.disabled = true;

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 400));

    try {
        const fromRate = exchangeRates[from];
        const toRate = exchangeRates[to];
        
        if (!fromRate || !toRate) throw new Error("Rate not found");

        // Convert to USD first (base), then to target currency
        const rate = toRate / fromRate;
        const result = (amount * rate).toFixed(2);
        
        const toSymbol = currencySymbols[to] || "";
        convertedText.textContent = `${toSymbol}${result}`;
        rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;

        // Save to Firestore
        saveToFirebase(from, to, amount, result);

    } catch (error) {
        console.error("Conversion failed:", error);
        rateInfo.textContent = "Conversion error. Please try again.";
        convertedText.textContent = "---";
    } finally {
        convertBtn.textContent = "Convert Now";
        convertBtn.disabled = false;
    }
}

async function saveToFirebase(from, to, amount, result) {
    try {
        await addDoc(collection(db, "conversions"), {
            from,
            to,
            amount: parseFloat(amount),
            result: parseFloat(result),
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Error adding document: ", e);
        // Note: This might fail if Firebase rules are not set to allow writes
    }
}

function loadHistory() {
    const q = query(collection(db, "conversions"), orderBy("timestamp", "desc"), limit(5));
    
    onSnapshot(q, (querySnapshot) => {
        historyList.innerHTML = '';
        if (querySnapshot.empty) {
            historyList.innerHTML = '<p class="empty-msg">No history yet.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const fromSym = currencySymbols[data.from] || "";
            const toSym = currencySymbols[data.to] || "";
            
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div>
                    <span class="history-val">${fromSym}${data.amount} ${data.from}</span>
                    <i class="fas fa-arrow-right" style="margin: 0 5px; font-size: 0.7rem; color: var(--primary)"></i>
                    <span class="history-val">${toSym}${data.result} ${data.to}</span>
                </div>
                <div class="history-time">${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}</div>
            `;
            historyList.appendChild(div);
        });
    }, (error) => {
        console.error("History listener failed:", error);
        historyList.innerHTML = '<p class="empty-msg">Unable to load history.</p>';
    });
}

// Event Listeners
fromSelect.addEventListener('change', updateSymbol);
convertBtn.addEventListener('click', convert);

swapBtn.addEventListener('click', () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    updateSymbol();
    convert();
});

// Auto-convert on enter
amountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') convert();
});

// Initial run
init();
// Initial conversion
setTimeout(convert, 500);
