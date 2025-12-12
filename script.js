// ==========================================
// LÓGICA GERAL E DE COMUNICAÇÃO
// ==========================================

// CONTROLE DE MANUTENÇÃO: Defina como 'true' para bloquear o login e mostrar a mensagem.
const MAINTENANCE_MODE = false;

// CONTATO DE SUPORTE: Defina seu nome de usuário do Telegram aqui (sem o @).
const TELEGRAM_SUPPORT_USERNAME = 'branco_futuro_oficial';

// ==========================================
// INICIALIZAÇÃO DO FIREBASE (COM ALERTA VISUAL)
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyAoRK_QV01Dvfr0HVwFH5UsKE1SY1uB5Ho",
  authDomain: "meu-painel-app-9f7ab.firebaseapp.com",
  projectId: "meu-painel-app-9f7ab",
  storageBucket: "meu-painel-app-9f7ab.firebasestorage.app",
  messagingSenderId: "972379366884",
  appId: "1:972379366884:web:1f657522d8cdb8699d93f1"
};

// Variáveis globais para o banco de dados
let db, auth;

try {
    // 1. Inicializa o Firebase
    if (typeof firebase === 'undefined') {
        throw new Error("Erro de carregamento: O Firebase não foi encontrado.");
    }
    
    firebase.initializeApp(firebaseConfig);

    // 2. Inicializa os serviços
    db = firebase.firestore();
    auth = firebase.auth();

    // 3. MOSTRA O ALERTA DE SUCESSO NA TELA
    // Isso vai fazer uma janela aparecer!
    // alert("✅ SUCESSO!\n\nO Firebase foi conectado corretamente.\nAgora seu painel está pronto para salvar dados na nuvem.");
    console.log("🔥 Firebase conectado com sucesso!");

} catch (erro) {
    // Se der erro, mostra um alerta vermelho
    // alert("❌ ERRO AO CONECTAR:\n" + erro.message);
    console.error(erro);
}

// ==========================================
// FIM DA INICIALIZAÇÃO
// ==========================================

// Variáveis globais para armazenar as estatísticas por hora de diferentes fontes
window.hourlyStats = {}; // Genérico, usado pelo seletor
window.hourlyStatsFromCorrector = {}; // Do Corretor de Sinais
window.hourlyStatsFromAnalyzer = {}; // Do Analisador de Sinais

// --- LÓGICA DE TEMA ---
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    document.getElementById('theme-switcher').innerText = isLight ? '🌙' : '☀️';
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-switcher').innerText = '🌙';
    } else {
        document.body.classList.remove('light-theme');
        document.getElementById('theme-switcher').innerText = '☀️';
    }
}



// Função que envia a lista gerada no painel SUITE para o painel CORRETOR
function enviarListaParaCorretor(listaGerada) {
    // Pega o textarea do corretor de sinais no painel SUITE
    const corretorTextareaSuite = document.getElementById('suite_correctorSignalsInput');
    if (corretorTextareaSuite) {
        corretorTextareaSuite.value = listaGerada;
        console.log("Lista enviada para o Corretor de Sinais em segundo plano.");
    }
}

// Função de COPIAR genérica
function copiar(idElemento, btnElement) {
    const texto = document.getElementById(idElemento).innerText;
    navigator.clipboard.writeText(texto).then(() => {
        if (btnElement) {
            const originalText = btnElement.innerHTML;
            btnElement.innerHTML = '✅ Copiado!';
            btnElement.disabled = true;
            setTimeout(() => { btnElement.innerHTML = originalText; btnElement.disabled = false; }, 2000);
        }
    }).catch(err => console.error("Erro ao copiar: ", err));
}

// Funções de persistência
function loadFromStorage() {
    try {
        // Carrega o Token da Blaze
        const savedToken = localStorage.getItem('blaze_token');
        if (savedToken) {
            document.getElementById('config_blaze_token').value = savedToken;
        }
        // Carrega configurações do Telegram salvas localmente
        const savedTelToken = localStorage.getItem('telegram_bot_token');
        const savedTelChatId = localStorage.getItem('telegram_chat_id');
        if (savedTelToken && document.getElementById('telegram_bot_token')) {
            document.getElementById('telegram_bot_token').value = savedTelToken;
        }
        if (savedTelChatId && document.getElementById('telegram_chat_id')) {
            document.getElementById('telegram_chat_id').value = savedTelChatId;
        }
        // Carrega o nome do operador (se houver lógica para isso)
        // document.getElementById('suite_userName').value = localStorage.getItem('suite_userName') || '';
    } catch (e) {
        console.error("Não foi possível carregar do localStorage:", e);
    }
}

function suite_saveSettings(btn) {
    // Salva o Token da Blaze
    const token = document.getElementById('config_blaze_token').value.trim();
    if (token) {
        localStorage.setItem('blaze_token', token);
    }
    
    // const userName = document.getElementById('suite_userName').value;
    // localStorage.setItem('suite_userName', userName);

    const resArea = document.getElementById('suite_resConfig');
    resArea.innerText = 'Configurações salvas com sucesso!';
    resArea.style.display = 'block';

    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ SALVO!';
    setTimeout(() => {
        resArea.style.display = 'none';
        btn.innerHTML = originalText;
    }, 2500);
}

function saveTelegramSettings(btn) {
    const token = document.getElementById('telegram_bot_token').value;
    const chatId = document.getElementById('telegram_chat_id').value;
    
    localStorage.setItem('telegram_bot_token', token);
    localStorage.setItem('telegram_chat_id', chatId);
    console.log("Salvando Configs do Telegram:", { token, chatId });

    const resArea = document.getElementById('resTelegramConfig');
    resArea.innerText = 'Configurações do Telegram salvas com sucesso!';
    resArea.style.display = 'block';

    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ SALVO!';
    setTimeout(() => { resArea.style.display = 'none'; btn.innerHTML = originalText; }, 2500);
}

async function testTelegramConnection(btn) {
    const token = document.getElementById('telegram_bot_token').value;
    const chatId = document.getElementById('telegram_chat_id').value;
    const resArea = document.getElementById('resTelegramConfig');

    if (!token || !chatId) {
        resArea.innerText = '❌ Preencha o Token e o ID do Chat primeiro.';
        resArea.style.color = 'var(--accent-blaze)';
        resArea.style.display = 'block';
        setTimeout(() => { resArea.style.display = 'none'; }, 3000);
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = 'Enviando...';
    btn.disabled = true;
    resArea.style.display = 'none';

    const message = "✅ *Teste de Conexão*\n\nOlá! Se você recebeu esta mensagem, suas configurações do Telegram no painel estão funcionando corretamente.";
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();

        if (data.ok) {
            resArea.innerText = '✅ Mensagem de teste enviada com sucesso!';
            resArea.style.color = 'var(--accent-jonbet)';
        } else {
            throw new Error(data.description || 'Erro desconhecido.');
        }
    } catch (error) {
        resArea.innerText = `❌ Falha ao enviar: ${error.message}`;
        resArea.style.color = 'var(--accent-blaze)';
    } finally {
        resArea.style.display = 'block';
        btn.innerHTML = originalText;
        btn.disabled = false;
        setTimeout(() => { resArea.style.display = 'none'; }, 5000);
    }
}

async function sendTelegramList(btn) {
    const token = document.getElementById('telegram_bot_token').value;
    const chatId = document.getElementById('telegram_chat_id').value;
    const message = document.getElementById('telegram_list_message').value;
    const resArea = document.getElementById('resTelegramConfig'); // Reutiliza a área de resultado

    if (!token || !chatId) {
        resArea.innerText = '❌ Preencha o Token e o ID do Chat nas configurações acima.';
        resArea.style.color = 'var(--accent-blaze)';
        resArea.style.display = 'block';
        setTimeout(() => { resArea.style.display = 'none'; }, 4000);
        return;
    }
    if (!message.trim()) {
        resArea.innerText = '❌ A caixa de mensagem da lista está vazia.';
        resArea.style.color = 'var(--accent-blaze)';
        resArea.style.display = 'block';
        setTimeout(() => { resArea.style.display = 'none'; }, 4000);
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = 'Enviando...';
    btn.disabled = true;
    resArea.style.display = 'none';

    try {
        // Reutiliza a função de notificação, enviando a mensagem para o chat de admin
        await sendTelegramNotification(message);
        resArea.innerText = '✅ Lista enviada com sucesso para o seu grupo/canal!';
        resArea.style.color = 'var(--accent-jonbet)';
        document.getElementById('telegram_list_message').value = ''; // Limpa o campo após o envio
    } catch (error) {
        resArea.innerText = `❌ Falha ao enviar a lista: ${error.message}`;
        resArea.style.color = 'var(--accent-blaze)';
    } finally {
        resArea.style.display = 'block';
        btn.innerHTML = originalText;
        btn.disabled = false;
        setTimeout(() => { resArea.style.display = 'none'; }, 5000);
    }
}
async function getTelegramSettings() {
    // 1. Prioriza as configurações locais do usuário (da aba Conexão)
    const localToken = localStorage.getItem('telegram_bot_token');
    const localChatId = localStorage.getItem('telegram_chat_id');
    if (localToken && localChatId) {
        return { bot_token: localToken, chat_id: localChatId };
    }
    try {
        const doc = await db.collection("settings").doc("telegram").get();
        if (doc.exists) {
            return doc.data();
        }
        return null; // No settings found
    } catch (error) {
        console.error("Erro ao buscar configurações do Telegram:", error);
        return null;
    }
}

async function sendTelegramNotification(message, targetChatId = null) {
    const settings = await getTelegramSettings();
    if (!settings || !settings.bot_token || !settings.chat_id) {
        throw new Error("Configurações do Telegram ausentes. Verifique a aba 'Conexão'.");
    }

    const { bot_token: token, chat_id: adminChatId } = settings;
    const finalChatId = targetChatId || adminChatId; // Usa o alvo específico ou o do admin
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: finalChatId, text: message, parse_mode: 'Markdown', disable_web_page_preview: true })
    });
    const data = await response.json();
    if (data.ok) console.log("Notificação enviada para o admin via Telegram.");
    else throw new Error(data.description);
}

async function sendGeneratedListToTelegram(btn) {
    const listContent = document.getElementById('suite_resGerador').innerText;
    const defaultText = "Resultado aqui...";

    if (!listContent || listContent.trim() === defaultText || listContent.trim() === "") {
        alert("Gere uma lista primeiro antes de enviar para o Telegram.");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = 'Enviando...';
    btn.disabled = true;

    try {
        // Reutiliza a função de notificação, que já busca as credenciais do Firebase
        await sendTelegramNotification(listContent);
        btn.innerHTML = '✅ Enviado!';
    } catch (error) {
        alert(`Falha ao enviar para o Telegram: ${error.message}`);
        btn.innerHTML = originalText;
    } finally {
        // Habilita o botão novamente e restaura o texto original após um tempo
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }, 3000);
    }
}

async function sendAnalysisToTelegram(btn) {
    const analysisContent = document.getElementById('suite_resAnalise').innerText;
    const defaultText = "Aguardando dados...";

    if (!analysisContent || analysisContent.trim() === defaultText || analysisContent.trim() === "") {
        alert("Gere uma análise primeiro antes de enviar para o Telegram.");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = 'Enviando...';
    btn.disabled = true;

    try {
        // Reutiliza a função de notificação, que já busca as credenciais do Firebase
        await sendTelegramNotification(analysisContent);
        btn.innerHTML = '✅ Enviado!';
    } catch (error) {
        alert(`Falha ao enviar para o Telegram: ${error.message}`);
        btn.innerHTML = originalText;
    } finally {
        // Habilita o botão novamente e restaura o texto original após um tempo
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }, 3000);
    }
}

async function sendIABrancoToTelegram(btn) {
    const listContent = document.getElementById('suite_resIABranco').innerText;

    if (!listContent || listContent.trim() === "") {
        alert("Gere uma lista da I.A. primeiro antes de enviar para o Telegram.");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = 'Enviando...';
    btn.disabled = true;

    try {
        await sendTelegramNotification(listContent);
        btn.innerHTML = '✅ Enviado!';
    } catch (error) {
        alert(`Falha ao enviar para o Telegram: ${error.message}`);
        btn.innerHTML = originalText;
    } finally {
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }, 3000);
    }
}

let autoFetchIntervalId = null; // Declaração explícita para melhor gerenciamento do intervalo

// ==========================================
// INÍCIO: SCRIPTS DE gerador_de_lista2.html
// ==========================================

// --- LÓGICA DE PLATAFORMA (SUITE) ---
function suite_selectPlatform(platform, isSync = false) {
    document.getElementById('suite_platformSelector').value = platform;
    document.getElementById('suite_btn-blaze').classList.remove('active');
    document.getElementById('suite_btn-jonbet').classList.remove('active');
    document.getElementById(`suite_btn-${platform}`).classList.add('active');

    const suitePanel = document.querySelector('.layout-panel.suite');
    if (platform === 'blaze') {
        suitePanel.classList.remove('platform-jonbet');
    } else { // jonbet
        suitePanel.classList.add('platform-jonbet');
    }
    // Sincroniza com o outro painel, evitando loop infinito
    if (!isSync) {
        dash_selectPlatform(platform, true);
    }
}

// --- LÓGICA DE ABAS (SUITE) ---
function suite_openTab(tabName) {
    let i, content, btns;
    content = document.querySelectorAll(".suite .tab-content");
    btns = document.querySelectorAll(".suite .tab-btn");

    for (i = 0; i < content.length; i++) {
        content[i].classList.remove("active");
    }
    for (i = 0; i < btns.length; i++) {
        btns[i].classList.remove("active");
    }

    // Popula os dados do usuário quando a aba de configurações é aberta
    if (tabName === 'config') {
        populateUserSettings();
    }

    // Verifica se a aba existe antes de tentar ativá-la
    const targetTab = document.getElementById('suite_' + tabName);
    if (targetTab) {
        targetTab.classList.add("active");
    }
    // CORREÇÃO: Verifica se o botão da aba existe antes de tentar adicionar a classe 'active'.
    // Isso evita o erro quando clicamos em um botão que não está na lista de abas (como o de Configurações).
    const tabButton = document.querySelector(`.suite .tab-btn[onclick="suite_openTab('${tabName}')"]`);
    if (tabButton) {
        tabButton.classList.add("active");
    }
}

function populateUserSettings() {
    const username = sessionStorage.getItem('operatorName');
    const accessLevel = sessionStorage.getItem('accessLevel');

    if (!username) return;

    document.getElementById('config_username').textContent = username;
    document.getElementById('config_accessLevel').textContent = accessLevel;

    let expirationText = 'Permanente'; // Padrão para admin
    let telegramIdText = 'N/A'; // Padrão

    // Busca os detalhes do usuário no localStorage para encontrar a data de expiração e o ID
    if (accessLevel !== 'admin') {
        try { // A lógica de usuários agora dependerá da sessão
            const users = JSON.parse(sessionStorage.getItem('app_users_temp')) || [];
            const currentUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

            if (currentUser) {
                if (currentUser.expiresAt) {
                    expirationText = new Date(currentUser.expiresAt).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });
                } else {
                    expirationText = 'Permanente';
                }
                // Pega o ID do Telegram do usuário
                telegramIdText = currentUser.telegramId || 'Não vinculado';
            }
        } catch (e) {
            console.error("Erro ao buscar dados do usuário:", e);
            expirationText = 'Erro ao carregar';
            telegramIdText = 'Erro ao carregar';
        }
    }

    // SUGESTÃO: Adiciona destaque visual para data de expiração próxima
    const expiresAtSpan = document.getElementById('config_expiresAt');
    expiresAtSpan.style.color = ''; // Reseta a cor
    expiresAtSpan.style.fontWeight = ''; // Reseta o peso da fonte

    if (accessLevel !== 'admin' && expirationText !== 'Permanente' && expirationText.includes('/')) {
        const users = JSON.parse(sessionStorage.getItem('app_users_temp')) || [];
        const currentUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (currentUser && currentUser.expiresAt) {
            const expirationDate = new Date(currentUser.expiresAt);
            const daysLeft = (expirationDate - new Date()) / (1000 * 60 * 60 * 24);

            if (daysLeft <= 1) { // Menos de 1 dia
                expiresAtSpan.style.color = 'var(--accent-blaze)';
                expiresAtSpan.style.fontWeight = 'bold';
            } else if (daysLeft <= 3) { // Menos de 3 dias
                expiresAtSpan.style.color = '#ffc107'; // Amarelo
                expiresAtSpan.style.fontWeight = 'bold';
            }
        }
    }
    document.getElementById('config_expiresAt').textContent = expirationText;
    document.getElementById('config_telegramId').textContent = telegramIdText;
}

function suite_clearTextarea(elementId) {
    const textarea = document.getElementById(elementId);
    if (textarea) {
        textarea.value = '';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

function suite_limparAnalisador() {
    suite_clearTextarea('suite_inputHistorico');
    document.getElementById('suite_resAnalise').innerText = 'Aguardando dados...';
}

function suite_updateQtdLabel() {
    const estrategia = document.getElementById('suite_estrategia').value;
    const label = document.getElementById('suite_labelQtdSinais');
    if (estrategia === 'branco') {
        label.innerText = 'Quantidade de Tiros:';
    } else {
        label.innerText = 'Quantidade de Sinais:';
    }
}

function suite_gerarSinaisSimples() {
    const qtd = parseInt(document.getElementById('suite_qtdSinais').value);
    const intervaloInput = document.getElementById('suite_intervalo').value;
    const intervalos = intervaloInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n > 0);
    if (intervalos.length === 0) {
        alert("Por favor, insira um valor de intervalo válido."); return;
    }
    const est = document.getElementById('suite_estrategia').value;
    const platform = document.getElementById('suite_platformSelector').value;
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const selectElement = document.getElementById('suite_estrategia');
    const userName = sessionStorage.getItem('operatorName') || 'Operador';
    const strategyName = selectElement.options[selectElement.selectedIndex].text;
    const filterByBestMinute = document.getElementById('suite_filterByBestMinute').checked;
    const minAssertiveness = parseInt(document.getElementById('suite_minAssertiveness').value) || 75;
    
    let out = `🚀 *LISTA DE OPERAÇÕES*\n`;
    out += `🚦 Plataforma: *${platformName}*\n`;
    out += `👤 Operador: *${userName}*\n`;
    out += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    out += `🎯 Estratégia: *${strategyName}*\n`;

    if (est === 'cacadorBranco') {
        intervalo = 15; // Força o intervalo para 15 minutos
    }

    if (est === 'branco') {
        out += `♻️ 06 Entradas\n`;
    } else {
        out += `🛡️ Proteção no Branco ⚪️\n`;
        out += `♻️ ATÉ *G1*\n`;
    }
    out += `--------------------------------\n`;
    let signalsGenerated = 0;
    let attempts = 0; // Para evitar loop infinito

    let bestMinutes = filterByBestMinute ? getBestPerformingMinutes(minAssertiveness) : [];
    if (filterByBestMinute && bestMinutes.length === 0) {
        // Se o filtro estiver ativo e nenhuma hora boa for encontrada,
        // tenta forçar uma análise do histórico disponível no painel direito.
        // Isso garante que getBestPerformingMinutes tenha dados para trabalhar.
        dash_enviarParaAnalise(); // Isso irá processar os dados em dash_inputData
        bestMinutes = getBestPerformingMinutes(minAssertiveness); // Tenta novamente após a análise

        if (bestMinutes.length === 0) {
            // SUGESTÃO: Adiciona um botão para desativar o filtro e tentar novamente.
            const resGerador = document.getElementById('suite_resGerador');
            resGerador.innerHTML = `
                <div style="padding: 15px; background-color: rgba(255, 152, 0, 0.1); border-left: 4px solid #ff9800; color: #ffc107;">
                    <p style="margin: 0 0 10px 0;"><strong>Aviso:</strong> Nenhum minuto com bom desempenho foi encontrado no histórico.</p>
                    <button onclick="document.getElementById('suite_filterByBestMinute').checked = false; suite_gerarSinaisSimples();" style="padding: 8px 12px; border: none; border-radius: 5px; background-color: #ff9800; color: #000; font-weight: bold; cursor: pointer;">
                        Desativar Filtro e Gerar Lista
                    </button>
                </div>`;
            return;
        }
    }

    let db = new Date();
    db.setMinutes(db.getMinutes() + 1);
    db.setSeconds(0);

    // Aumenta o limite de tentativas para acomodar a busca por minutos ideais
    while (signalsGenerated < qtd && attempts < (qtd * 500)) { // Aumentado de 100 para 500
        attempts++;
        // Pega o próximo intervalo do ciclo
        let minutosParaAdicionar = intervalos[signalsGenerated % intervalos.length];

        if (est === 'jikanSazonal') {
            const currentHour = db.getHours();
            const intervalModifier = (currentHour >= 6 && currentHour < 18) ? 0.8 : 1.2;
            minutosParaAdicionar = Math.round(minutosParaAdicionar * intervalModifier);
        }

        // Se o filtro estiver ativo, verifica se o minuto do sinal é um dos melhores
        if (filterByBestMinute) {
            let potentialTime = new Date(db.getTime() + (minutosParaAdicionar * 60000));
            if (!bestMinutes.includes(potentialTime.getMinutes())) {
                // Se não for uma boa hora, avança o tempo e tenta de novo
                db.setMinutes(db.getMinutes() + minutosParaAdicionar);
                continue; // Pula para a próxima iteração do loop
            }
        }

        // Se passou na verificação (ou se o filtro está desligado), gera o sinal
        signalsGenerated++;

        let i = signalsGenerated - 1; // Para manter a lógica de alternância

        db.setMinutes(db.getMinutes() + minutosParaAdicionar);

        const h1 = db.getHours().toString().padStart(2,'0') + ':' + db.getMinutes().toString().padStart(2,'0');

        let cor, emo;
        // SUGESTÃO: Agrupa as estratégias de branco
        if (est === 'branco' || est === 'cacadorBranco') {
            cor = "BRANCO";
            emo = "⚪";
        } else {
            switch(est) {
                case 'padrao': cor = (i % 2 === 0) ? "VERMELHO" : "PRETO"; break;
                case 'sequenciaInversa': cor = (i % 2 === 0) ? "PRETO" : "VERMELHO"; break;
                case 'xadrez': cor = (i % 2 === 0) ? "PRETO" : "VERMELHO"; break;
                case 'duplos': cor = (Math.floor(i / 2) % 2 === 0) ? "VERMELHO" : "PRETO"; break;
                case 'triplos': cor = (Math.floor(i / 3) % 2 === 0) ? "VERMELHO" : "PRETO"; break;
                case 'focoVermelho': cor = (Math.random() < 0.7) ? "VERMELHO" : "PRETO"; break;
                case 'focoPreto': cor = (Math.random() < 0.7) ? "PRETO" : "VERMELHO"; break;
                case 'jikanSazonal': cor = (i % 2 === 0) ? "VERMELHO" : "PRETO"; break;
                default: cor = (Math.random() > 0.5) ? "VERMELHO" : "PRETO";
            }

            if (cor === "VERMELHO") {
                emo = (platform === 'jonbet') ? '🟢' : '🔴';
            } else {
                emo = '⚫';
            }
        }
        out += `🕒 ${h1} ➔ ${emo}\n`;
    }
    out += `--------------------------------\n✅ Gerencie sua banca!\n`;
    document.getElementById('suite_resGerador').innerText = out;
    enviarListaParaCorretor(out);

}

// Função auxiliar para calcular desvio padrão
function calculateStandardDeviation(array) {
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

function suite_toggleIaBrancoMode(isAuto) {
    const historicoContainer = document.getElementById('suite_iaBranco_historico_container');
    const estrategiaSelect = document.getElementById('suite_iaBranco_estrategia');
    const agressividadeContainer = document.getElementById('suite_iaBranco_agressividade_container');
    historicoContainer.style.display = isAuto ? 'none' : 'block';
    agressividadeContainer.style.display = isAuto ? 'block' : 'none';
    // estrategiaSelect.disabled = isAuto; // Mantém o seletor de estratégia habilitado
}
// SUGESTÃO: Função para mostrar/ocultar opções da estratégia "Branco Próximo"
function suite_toggleBrancoProximoOptions() {
    const estrategia = document.getElementById('suite_iaBranco_estrategia').value;
    const optionsContainer = document.getElementById('suite_brancoProximo_options_container');
    optionsContainer.style.display = (estrategia === 'brancoProximo') ? 'block' : 'none';
}

function suite_gerarSinaisBrancoIA() {
    const qtd = parseInt(document.getElementById('suite_iaBranco_qtdSinais').value);
    const historicoInput = document.getElementById('suite_iaBranco_historico').value;
    const est = document.getElementById('suite_iaBranco_estrategia').value;
    const platform = document.getElementById('suite_platformSelector').value;
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const selectElement = document.getElementById('suite_iaBranco_estrategia');
    const dateChoice = document.getElementById('suite_ia_branco_date_selector').value;
    const userName = sessionStorage.getItem('operatorName') || 'Operador';
    const strategyName = selectElement.options[selectElement.selectedIndex].text;
    const isAutoMode = document.getElementById('suite_iaBranco_autoMode').checked;
    const agressividade = document.getElementById('suite_iaBranco_agressividade').value;

    let out = `⚪ *LISTA DE SINAIS PARA BRANCO*\n`;
    out += `🚦 Plataforma: *${platformName}*\n`;
    
    const targetDate = new Date();
    if (dateChoice === 'amanha') {
        targetDate.setDate(targetDate.getDate() + 1);
    }
    out += `📅 Data: *${targetDate.toLocaleDateString('pt-BR')}*\n`;
    out += `👤 Operador: *${userName}*\n`;
    if (isAutoMode) {
        out += `🎯 Estratégia: *${strategyName} (Auto ${agressividade})*\n`;
    } else {
        out += `🎯 Estratégia: *${strategyName}*\n`;
    }
    out += `♻️ 6 Entradas\n`;
    out += `--------------------------------\n`;

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const horarios = historicoInput.split('\n').map(l => l.trim()).filter(l => timeRegex.test(l));
    
    // CORREÇÃO: Move a verificação para dentro do 'else', permitindo que a estratégia 'brancoProximo'
    // execute sua própria lógica de verificação de dados sem ser bloqueada aqui.
    if (est !== 'brancoProximo' && !isAutoMode && horarios.length < 2) {
        document.getElementById('suite_resIABranco').innerText = "⚠️ É necessário fornecer pelo menos 2 horários no histórico para que a I.A. possa analisar e gerar os sinais.";
        return;
    }

    let db = new Date(); // Ponto de partida é sempre o horário atual para gerar sinais futuros.


    let analysisNote = '';
    let projectionIntervals = [];

    if (horarios.length > 1) {
        const intervals = [];
        for (let i = 1; i < horarios.length; i++) {
            intervals.push(timeDifferenceInMinutes(horarios[i-1], horarios[i]));
        }
        const mediaIntervalos = intervals.length > 0 ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : 0; // Garante que não haja divisão por zero

        switch(est) {
            case 'iaPreditivaBranco': // 1. I.A. Preditiva
                if (mediaIntervalos > 0) {
                    projectionIntervals = [mediaIntervalos];
                    analysisNote = `🧠 Média Aprendida: ${mediaIntervalos} min`;
                }
                break;
            case 'produtividadeHora': // 2. Análise de Produtividade
                const firstTime = horarios[0];
                const lastTime = horarios[horarios.length - 1];
                const totalDurationHours = timeDifferenceInMinutes(firstTime, lastTime) / 60;
                if (totalDurationHours > 0) {
                    const brancosPorHora = horarios.length / totalDurationHours;
                    const intervaloProdutividade = Math.round(60 / brancosPorHora);
                    if (intervaloProdutividade > 0) {
                        projectionIntervals = [intervaloProdutividade];
                        analysisNote = `📈 Produtividade: ${brancosPorHora.toFixed(2)} brancos/h. Intervalo: ${intervaloProdutividade} min`;
                    }
                }
                break;
            case 'horarioPico': // 3. Análise de Horário de Pico
                const weightedSum = horarios.reduce((sum, time) => {
                    const [h, m] = time.split(':').map(Number);
                    const decimalHour = h + m / 60;
                    return sum + decimalHour; // Peso = 1 para cada ocorrência
                }, 0);
                const mediaPonderada = weightedSum / horarios.length;
                const picoH = Math.floor(mediaPonderada);
                const picoM = Math.round((mediaPonderada - picoH) * 60);
                analysisNote = `🎯 Horário de Pico (Média): ${picoH.toString().padStart(2,'0')}:${picoM.toString().padStart(2,'0')}`;
                // Gera sinais em torno do horário de pico
                // O ponto de partida (db) continua sendo o horário atual.
                projectionIntervals = [60]; // Gera um sinal por hora perto do pico
                break;
            case 'velocidadeConclusao': // 4. Análise de Velocidade
                if (mediaIntervalos > 0) {
                    const taxaConclusao = 1 / mediaIntervalos; // brancos por minuto
                    const tempoRestante = 1 / taxaConclusao; // minutos para o próximo
                    projectionIntervals = [Math.round(tempoRestante)];
                    analysisNote = `⚡ Taxa: 1 branco a cada ${Math.round(tempoRestante)} min`;
                }
                break;
            case 'pomodoroOtimizado': // 5. Análise de Ciclo (Pomodoro)
                const stdDev = calculateStandardDeviation(intervals);
                const complexidade = Math.min(10, Math.max(1, Math.round(stdDev / 5))); // Escala de 1 a 10
                let pausa;
                if (complexidade <= 3) pausa = 5;
                else if (complexidade <= 7) pausa = 10;
                else pausa = 15;
                projectionIntervals = [25, pausa]; // Alterna trabalho e pausa
                analysisNote = `🍅 Ciclo Pomodoro: Complexidade ${complexidade} -> Pausa de ${pausa} min`;
                break;
            case 'eficienciaTemporal': // 6. Análise de Eficiência Temporal
                const duracaoTotal = timeDifferenceInMinutes(horarios[0], horarios[horarios.length - 1]);
                const tempoAtivo = intervals.reduce((a, b) => a + b, 0);
                if (duracaoTotal > 0) {
                    const eficiencia = (tempoAtivo / duracaoTotal); // Mais perto de 1 = mais espalhado
                    const intervaloAjustado = Math.round(mediaIntervalos * eficiencia);
                    if (intervaloAjustado > 0) {
                        projectionIntervals = [intervaloAjustado];
                        analysisNote = `⏱️ Eficiência: ${(100 / eficiencia).toFixed(0)}%. Intervalo ajustado: ${intervaloAjustado} min`;
                    }
                }
                break;
            case 'distribuicao702010': // 7. Análise de Distribuição (70/20/10)
                const sortedIntervals = [...intervals].sort((a, b) => a - b);
                const p70 = sortedIntervals[Math.floor(sortedIntervals.length * 0.7)];
                const p90 = sortedIntervals[Math.floor(sortedIntervals.length * 0.9)];
                // 70% curtos (até p70), 20% médios (até p90), 10% longos (acima de p90)
                const curtos = sortedIntervals.filter(i => i <= p70);
                const medios = sortedIntervals.filter(i => i > p70 && i <= p90);
                const longos = sortedIntervals.filter(i => i > p90);
                const avgCurto = Math.round(curtos.reduce((a, b) => a + b, 0) / (curtos.length || 1));
                const avgMedio = Math.round(medios.reduce((a, b) => a + b, 0) / (medios.length || 1));
                const avgLongo = Math.round(longos.reduce((a, b) => a + b, 0) / (longos.length || 1));
                projectionIntervals = [avgCurto, avgCurto, avgCurto, avgCurto, avgCurto, avgCurto, avgCurto, avgMedio, avgMedio, avgLongo];
                analysisNote = `📊 Distribuição 70/20/10: [${avgCurto}, ${avgMedio}, ${avgLongo}] min`;
                break;
            case 'brancoProximo': // 8. Branco Próximo (Análise por Hora)
                analysisNote = `🎯 Análise de Padrões de Cores pré-Branco`;
                
                // SUGESTÃO: Agora busca o histórico do campo "Entrada Manual / Análise Final"
                const historyText = document.getElementById('dash_inputData').value;
                if (!historyText || historyText.trim().length < 10) { // Verifica se há conteúdo suficiente
                    document.getElementById('suite_resIABranco').innerText = "⚠️ Para a estratégia 'Branco Próximo', é necessário ter um histórico válido no campo 'Entrada Manual / Análise Final' do painel direito.";
                    return;
                }
                // A verificação de conteúdo foi movida para a lógica principal da estratégia.
                // const fullHistoryForPatterns = document.getElementById('suite_inputHistorico').value;
                // if (!fullHistoryForPatterns.trim()) {
                //     document.getElementById('suite_resIABranco').innerText = "⚠️ Para a estratégia 'Branco Próximo', cole o histórico completo de cores na aba 'Analisar Histórico' primeiro.";
                //     return;
                // }
                // Esta estratégia não usa um intervalo de projeção, ela gera sinais diretamente.
                // A lógica será tratada após este bloco switch.
                break;
            default:
                // Por padrão, usa a média se nenhuma outra estratégia for correspondida
                projectionIntervals = [mediaIntervalos];
                break;
        }
    }
    
    // Lógica para MODO AUTOMÁTICO (sem histórico)
    if (isAutoMode) {
        analysisNote = `🤖 Modo Automático (${agressividade}) Ativado`;
        const intervalos = {
            conservador: {
                iaPreditivaBranco: [40, 50, 60],
                produtividadeHora: [30],
                horarioPico: [60, 75],
                velocidadeConclusao: [25, 35],
                pomodoroOtimizado: [45, 15],
                eficienciaTemporal: [40, 50],
                distribuicao702010: [30, 30, 45, 45, 60, 90]
            },
            moderado: {
                iaPreditivaBranco: [25, 35, 45],
                produtividadeHora: [20],
                horarioPico: [60],
                velocidadeConclusao: [15, 20],
                pomodoroOtimizado: [25, 5, 25, 15],
                eficienciaTemporal: [30, 40],
                distribuicao702010: [15, 15, 15, 30, 30, 60]
            },
            agressivo: {
                iaPreditivaBranco: [15, 20, 25],
                produtividadeHora: [10],
                horarioPico: [45],
                velocidadeConclusao: [8, 12],
                pomodoroOtimizado: [20, 5],
                eficienciaTemporal: [15, 25],
                distribuicao702010: [10, 10, 15, 15, 20, 30]
            }
        };

        switch(est) {
            case 'iaPreditivaBranco': projectionIntervals = intervalos[agressividade].iaPreditivaBranco; break;
            case 'produtividadeHora': projectionIntervals = intervalos[agressividade].produtividadeHora; break;
            case 'horarioPico': projectionIntervals = intervalos[agressividade].horarioPico; break;
            case 'velocidadeConclusao': projectionIntervals = intervalos[agressividade].velocidadeConclusao; break;
            case 'pomodoroOtimizado': projectionIntervals = intervalos[agressividade].pomodoroOtimizado; break;
            case 'eficienciaTemporal': projectionIntervals = intervalos[agressividade].eficienciaTemporal; break;
            case 'distribuicao702010': projectionIntervals = intervalos[agressividade].distribuicao702010; break;
            default:
                projectionIntervals = intervalos[agressividade].iaPreditivaBranco; // Padrão genérico
                break;
        }
    }

    if (analysisNote) {
        out += `${analysisNote}\n--------------------------------\n`;
    }

    // CORREÇÃO: A estratégia 'brancoProximo' tem sua própria lógica de geração e não usa 'projectionIntervals'.
    // Portanto, esta verificação de intervalo deve ser pulada para essa estratégia específica,
    // permitindo que ela prossiga para sua lógica de análise de padrões de cores.
    if (est !== 'brancoProximo') {
        if (projectionIntervals.length === 0 || projectionIntervals.every(p => p <= 0)) {
            document.getElementById('suite_resIABranco').innerText = "⚠️ Não foi possível calcular um padrão de intervalo com base no histórico fornecido. Verifique os dados.";
            return;
        }
    }

    // Lógica específica para a nova estratégia "Branco Próximo"
    // SUGESTÃO: Lógica completamente refeita para analisar padrões de cores
    // CORREÇÃO: Lógica ajustada para ler do painel direito (Entrada Manual / Análise Final)
    if (est === 'brancoProximo') {
        const rawData = document.getElementById('dash_inputData').value;
        // CORREÇÃO: Se a estratégia for 'brancoProximo', a lógica de geração de sinais é diferente.
        // O resultado é gerado aqui e a função deve terminar para não ser sobrescrito.
        // Por isso, a variável 'out' é reiniciada e a função retorna no final deste bloco.
        out = `⚪ *LISTA DE SINAIS PARA BRANCO*\n` + out.split('\n').slice(1, 6).join('\n') + '\n';


        const platform = document.getElementById('dash_platformSelector').value;

        // 1. Processa o texto do histórico para extrair os números
        const tokens = rawData.split(/[\s,]+/).filter(n => n.trim() !== '');
        const numeros = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const proximoToken = tokens[i + 1];
            if (!isNaN(parseInt(token)) && proximoToken && proximoToken.includes(':')) {
                numeros.push(parseInt(token));
                i++; // Pula o horário
            }
        }

        // 2. Mantém os números (pedras) para análise, revertendo para a ordem cronológica
        const historyNumbers = numeros.reverse();

        if (historyNumbers.length < 5) {
            document.getElementById('suite_resIABranco').innerText = "⚠️ Histórico insuficiente para análise de padrões. São necessários pelo menos 5 resultados.";
            return;
        }

        // SUGESTÃO: Pega o tamanho do padrão selecionado pelo usuário
        const patternSize = parseInt(document.getElementById('suite_brancoProximo_patternSize').value);

        // 3. Análise de Padrões (agora com números)
        const patterns = {};
        // Encontra todos os padrões de NÚMEROS do tamanho escolhido que antecedem um branco (número 0)
        for (let i = patternSize; i < historyNumbers.length; i++) {
            // Verifica se o número atual é um branco (0)
            if (historyNumbers[i] === 0) {
                // Pega o padrão de números anteriores
                const patternSequence = historyNumbers.slice(i - patternSize, i);
                
                // Garante que o padrão não contenha outro branco
                if (patternSequence.every(num => num !== 0)) {
                    const pattern = patternSequence.join('-');
                    patterns[pattern] = (patterns[pattern] || 0) + 1;
                }
            }
        }

        // 4. Encontra o padrão de números mais frequente
        let mostFrequentPattern = null;
        let maxCount = 0;
        for (const p in patterns) {
            if (patterns[p] > maxCount) {
                mostFrequentPattern = p;
                maxCount = patterns[p];
            }
        }

        if (mostFrequentPattern) {
            // REFINAMENTO: Em vez de mostrar apenas o padrão dominante, agora listamos todos os padrões encontrados.
            out += `🎯 Padrões Encontrados (que antecedem o 0):\n`;
            const sortedPatterns = Object.entries(patterns).sort(([,a],[,b]) => b-a); // Ordena por frequência

            sortedPatterns.forEach(([pattern, count]) => {
                const isDominant = pattern === mostFrequentPattern ? ' (Dominante 🔥)' : '';
                out += `   - ${pattern.replace(/-/g, ' → ')} (x${count})${isDominant}\n`;
            });
            out += `\n`; // Adiciona uma linha em branco para separar

            out += `--------------------------------\n`;

            // REFINAMENTO: A lógica de projeção inteligente foi restaurada.
            // 1. Calcula o intervalo médio específico do padrão encontrado.
            const patternIntervals = [];
            const patternOccurrences = historyNumbers.map((num, i) => (num === 0 && historyNumbers.slice(i - patternSize, i).join('-') === mostFrequentPattern) ? i : -1).filter(i => i !== -1);
            for (let i = 1; i < patternOccurrences.length; i++) {
                patternIntervals.push(patternOccurrences[i] - patternOccurrences[i-1]);
            }
            const patternAvgInterval = patternIntervals.length > 0 ? Math.round(patternIntervals.reduce((a, b) => a + b, 0) / patternIntervals.length) : 0;
            
            // 2. Calcula o intervalo médio geral de todos os brancos como um fallback.
            const allIntervals = [];
            let lastWhiteIndex = -1;
            for (let i = 0; i < historyNumbers.length; i++) {
                if (historyNumbers[i] === 0) {
                    if (lastWhiteIndex !== -1) allIntervals.push(i - lastWhiteIndex);
                    lastWhiteIndex = i;
                }
            }
            const generalAvgInterval = allIntervals.length > 0 ? Math.round(allIntervals.reduce((a, b) => a + b, 0) / allIntervals.length) : 15;
            
            // 3. NOVO CÁLCULO: Soma os números do padrão dominante para criar um novo fator de intervalo.
            const patternSumInterval = mostFrequentPattern.split('-').map(Number).reduce((a, b) => a + b, 0);

            // 4. REFINAMENTO: Em vez de escolher um intervalo, agora combinamos os três em uma média ponderada.
            // Isso "soma" todas as lógicas em um único cálculo final.
            const baseInterval = patternAvgInterval > 0 ? patternAvgInterval : generalAvgInterval;
            const projectionInterval = Math.round((baseInterval * 0.6) + (patternSumInterval * 0.4)); // 60% peso para o tempo, 40% para a soma

            out += `🔥 Padrão dominante identificado!\n`;
            out += `Projetando com base no intervalo de ${projectionInterval} min.\n`;
            out += `(Cálculo híbrido: Média de tempo: ${baseInterval}min, Soma do padrão: ${patternSumInterval})\n`;
            out += `\n`;
            // REFINAMENTO: Adiciona um limite de tempo para a geração de sinais.
            // A lista não se estenderá por mais de 1 hora a partir do momento da geração.
            let signalTime = new Date();
            const timeLimit = new Date(signalTime.getTime() + 60 * 60 * 1000); // Limite de 1 hora

            if (projectionInterval <= 0) out += 'Intervalo de projeção inválido (0 min). Nenhum sinal gerado.\n';

            // REFINAMENTO: Aumenta o número de iterações para garantir que a lista seja preenchida
            // com o máximo de sinais possível dentro do limite de 1 hora.
            for (let i = 0; i < 30 && projectionInterval > 0; i++) { // Tenta gerar até 30 sinais, mas o limite de tempo prevalece.
                signalTime.setMinutes(signalTime.getMinutes() + projectionInterval);
                // Se o próximo sinal ultrapassar o limite de 1 hora, para a geração.
                if (signalTime > timeLimit) break;
                const timeString = signalTime.getHours().toString().padStart(2, '0') + ':' + signalTime.getMinutes().toString().padStart(2, '0');
                out += `🕒 ${timeString} ➔ ⚪\n`;
            }
        } else {
            out += `Nenhum padrão de ${patternSize} pedras antes de um branco foi encontrado no histórico fornecido.\n`;
        }
        out += `--------------------------------\n`
        out += `⚠️ Use como base para suas análises.`;
        document.getElementById('suite_resIABranco').innerText = out;
        return; // Finaliza a execução para não sobrescrever o resultado.
    }

    // CORREÇÃO: Este bloco de geração de sinais foi movido para cá.
    // Ele agora é executado para todas as estratégias que usam 'projectionIntervals',
    // pois a estratégia 'brancoProximo' já retornou e finalizou sua execução.
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // Limite de 24 horas

    for (let i = 0; i < qtd; i++) {
        if (projectionIntervals.length === 0) break; // Segurança
        let minutosParaAdicionar = projectionIntervals[i % projectionIntervals.length];

        if (est === 'iaPreditivaBranco' && minutosParaAdicionar > 0) {
            const randomFactor = Math.random();
            let dynamicInterval = Math.round(minutosParaAdicionar * (randomFactor > 0.7 ? 1.2 + randomFactor : 0.6 + randomFactor));
            minutosParaAdicionar = Math.max(1, dynamicInterval);
        }

        db.setMinutes(db.getMinutes() + minutosParaAdicionar);

        if (db > endTime) {
            out += `\n-- Limite de 24h atingido --\n`;
            break;
        }

        const h1 = db.getHours().toString().padStart(2, '0') + ':' + db.getMinutes().toString().padStart(2, '0');
        out += `🕒 ${h1} ➔ ⚪\n`;
    }

    out += `--------------------------------\n`
    out += `⚠️ Use como base para suas análises.`;
    document.getElementById('suite_resIABranco').innerText = out;

}

// ==========================================
// INÍCIO: SCRIPTS DE coressao_de_sinais.html (DASHBOARD)
// ==========================================

// --- LÓGICA DE PLATAFORMA (DASHBOARD) ---
function dash_selectPlatform(platform, isSync = false) {
    const dashSelector = document.getElementById('dash_platformSelector');
    if (dashSelector) dashSelector.value = platform;
    
    const btnBlaze = document.getElementById('dash_btn-blaze');
    const btnJonbet = document.getElementById('dash_btn-jonbet');
    
    if (btnBlaze) btnBlaze.classList.remove('active');
    if (btnJonbet) btnJonbet.classList.remove('active');
    
    const targetBtn = document.getElementById(`dash_btn-${platform}`);
    if (targetBtn) targetBtn.classList.add('active');

    const dashPanel = document.querySelector('.layout-panel.dashboard');
    if (dashPanel) {
        if (platform === 'blaze') {
            dashPanel.classList.remove('platform-jonbet');
        } else { // jonbet
            dashPanel.classList.add('platform-jonbet');
        }
    }
    
    // Sincroniza com o painel SUITE para manter consistência
    if (!isSync && typeof suite_selectPlatform === 'function') {
        suite_selectPlatform(platform, true);
    }
}

// --- LÓGICA DE ABAS (DASHBOARD) ---
function dash_openTab(tabName) {
    const content = document.querySelectorAll(".dashboard .tab-content");
    const btns = document.querySelectorAll(".dashboard .tab-btn");

    content.forEach(c => c.classList.remove("active"));
    btns.forEach(b => b.classList.remove("active"));

    const targetContent = document.getElementById('dash_' + tabName);
    if (targetContent) targetContent.classList.add("active");
    
    const tabButton = document.querySelector(`.dashboard .tab-btn[onclick="dash_openTab('${tabName}')"]`);
    if (tabButton) tabButton.classList.add("active");
}

// ==========================================
// INICIALIZAÇÃO AUTOMÁTICA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage(); // Carrega Token e ID salvos
    applySavedTheme(); // Aplica o tema (claro/escuro) salvo
});