// --- VARIÁVEIS GLOBAIS DE CONFIGURAÇÃO ---
const MAINTENANCE_MODE = false;
const TELEGRAM_SUPPORT_USERNAME = 'SuporteCortex';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAoRK_QV01Dvfr0HVwFH5UsKE1SY1uB5Ho",
    authDomain: "meu-painel-app-9f7ab.firebaseapp.com",
    projectId: "meu-painel-app-9f7ab",
    storageBucket: "meu-painel-app-9f7ab.firebasestorage.app",
    messagingSenderId: "972379366884",
    appId: "1:972379366884:web:1f657522d8cdb8699d93f1"
};

// Inicializa o Firebase e o Firestore (db)
let db;
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    console.log("🔥 Firebase conectado com sucesso!");
} else {
    console.error("Erro: SDK do Firebase não foi carregado corretamente.");
}

// --- SEGURANÇA: FUNÇÕES DE HASH (BCRYPT) ---
const hashPassword = async (password) => {
    return new Promise((resolve, reject) => {
        if (typeof dcodeIO === 'undefined' || !dcodeIO.bcrypt) {
            reject(new Error("Biblioteca Bcrypt não carregada."));
            return;
        }
        dcodeIO.bcrypt.genSalt(10, (err, salt) => {
            if (err) reject(err);
            else dcodeIO.bcrypt.hash(password, salt, (err, hash) => {
                if (err) reject(err);
                else resolve(hash);
            });
        });
    });
};

const verifyPassword = async (password, hashedPassword) => {
    return new Promise((resolve, reject) => {
        if (typeof dcodeIO === 'undefined' || !dcodeIO.bcrypt) {
            reject(new Error("Biblioteca Bcrypt não carregada."));
            return;
        }
        dcodeIO.bcrypt.compare(password, hashedPassword, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
};

// --- FUNÇÕES AUXILIARES ---
async function getTelegramSettings() {
    try {
        if (!db) return { bot_token: null, chat_id: null, welcome_message: "Bem-vindo!" };
        const doc = await db.collection('settings').doc('telegram').get();
        if (doc.exists) return doc.data();
    } catch (e) { console.error(e); }
    return { bot_token: null, chat_id: null, welcome_message: "Bem-vindo!" };
}

async function sendTelegramNotification(message, targetChatId = null) {
    try {
        const settings = await getTelegramSettings();
        const token = settings.bot_token;
        // Usa o ID passado ou o padrão das configurações
        const chatId = targetChatId || settings.chat_id;

        if (!token || !chatId) {
            console.log(`[Telegram] (Sem Token/ID): "${message}"`);
            return;
        }

        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        console.log(`[Telegram] Mensagem enviada para ${chatId}`);
    } catch (error) {
        console.error("[Telegram] Erro ao enviar mensagem:", error);
    }
}