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

const API_URL = "https://api.exchangerate-api.com/v4/latest/";

const currencySymbols = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$", CHF: "CHF", 
    CNY: "¥", INR: "₹", BRL: "R$", RUB: "₽", KRW: "₩", MXN: "$", NZD: "$",
    SGD: "$", HKD: "$", NOK: "kr", SEK: "kr", TRY: "₺", ZAR: "R"
};

const currencies = [
    "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "BRL", 
    "RUB", "KRW", "MXN", "NZD", "SGD", "HKD", "NOK", "SEK", "TRY", "ZAR",
    "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AWG", "AZN", "BAM",
    "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BSD", "BTN",
    "BWP", "BYN", "BZD", "CDF", "CLP", "COP", "CRC", "CUP", "CVE", "CZK",
    "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "FJD", "FKP", "FOK",
    "GEL", "GGP", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HNL", "HRK",
    "HTG", "HUF", "IDR", "ILS", "IMP", "IQD", "IRR", "ISK", "JEP", "JMD",
    "JOD", "KES", "KGS", "KHR", "KID", "KMF", "KWD", "KYD", "KZT", "LAK",
    "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK",
    "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MYR", "MZN", "NAD", "NGN",
    "NIO", "NPR", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG",
    "QAR", "RON", "RSD", "RWF", "SAR", "SBD", "SCR", "SDG", "SHP", "SLE",
    "SLL", "SOS", "SRD", "SSP", "STN", "SYP", "SZL", "THB", "TJS", "TMT",
    "TND", "TOP", "TVD", "TWD", "TZS", "UAH", "UGX", "UYU", "UZS", "VES",
    "VND", "VUV", "WST", "XAF", "XCD", "XDR", "XOF", "XPF", "YER", "ZMW"
];

// Initialize dropdowns
function init() {
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

    try {
        const response = await fetch(`${API_URL}${from}`);
        const data = await response.json();
        
        if (data.result === "error") throw new Error("API Error");

        const rate = data.rates[to];
        const result = (amount * rate).toFixed(2);
        
        const toSymbol = currencySymbols[to] || "";
        convertedText.textContent = `${toSymbol}${result}`;
        rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;

        // Save to Firestore
        saveToFirebase(from, to, amount, result);

    } catch (error) {
        console.error("Conversion failed:", error);
        rateInfo.textContent = "Error fetching rates. Please try again.";
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
