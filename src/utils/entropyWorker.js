// Web Worker for Password Validation (Background Thread)
// Totalmente espelhado com a classe PasswordValidator do Backend

self.addEventListener("message", (e) => {
    const password = e.data.password || "";

    // Regras exatas espelhadas do Backend (PasswordValidator.ts)
    const MIN_LENGTH = 6;
    const SPECIAL_REGEX = /[!@#$%^&*()\-=_+[\]{};':"\\|,.<>/?~`]/;
    const NUMBER_REGEX = /[0-9]/;
    const UPPER_REGEX = /[A-Z]/;

    if (password.length < MIN_LENGTH) {
        self.postMessage({ score: 1, feedback: `Mínimo ${MIN_LENGTH} chars`, entropy: 0 });
        return;
    }

    // Backend Scoring Logic
    let score = 0;
    if (NUMBER_REGEX.test(password)) score++;
    if (SPECIAL_REGEX.test(password)) score++;
    if (UPPER_REGEX.test(password)) score++;
    if (password.length > 10) score++;

    // Mapeamento visual para o Frontend (4 Barras)
    let uiScore = 0;
    let feedback = "";

    // Se a pontuação do backend for <= 2, o Backend retorna "FRACA" e BLOQUEIA com Erro 400.
    if (score <= 1) {
        uiScore = 1;
        feedback = "MUITO FRACA";
    } else if (score === 2) {
        uiScore = 2;
        // O Backend exige pontuação 3 para aprovar, então a nível 2 avisamos o que falta
        feedback = "FRACA (Falta Maiúscula, Número ou Símbolo)";
    } 
    // Se a pontuação do backend for === 3, o Backend retorna "MODERADA" e APROVA.
    else if (score === 3) {
        uiScore = 3;
        feedback = "MODERADA";
    } 
    // Se a pontuação do backend for >= 4, o Backend retorna "FORTE" e APROVA.
    else {
        uiScore = 4;
        feedback = "FORTE (INVIOLÁVEL)";
    }

    self.postMessage({
        score: uiScore,
        feedback: feedback,
        entropy: score * 25 // Apenas metadado
    });
});
