document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. CONTROL DE TEMA (MODO OSCURO / CLARO)
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const rootElement = document.documentElement; 

    function applyTheme(theme) {
        if (theme === 'dark') {
            rootElement.classList.add('dark-mode');
            themeToggleBtn.textContent = ' Modo Claro';
        } else {
            rootElement.classList.remove('dark-mode');
            themeToggleBtn.textContent = ' Modo Oscuro';
        }
    }

    let savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('theme') || 'light';
    } catch (e) {
        console.warn("localStorage bloqueado temporalmente.");
    }
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const isDark = rootElement.classList.contains('dark-mode');
        const newTheme = isDark ? 'light' : 'dark';
        
        applyTheme(newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        } catch (e) {}
    });


    // ==========================================
    // 2. REPRODUCTOR DE MÚSICA DE FONDO
    // ==========================================
    const musicBtn = document.getElementById('music-btn');
    const bgMusic = document.getElementById('bg-music');
    let isPlaying = false;

    if (musicBtn && bgMusic) {
        musicBtn.addEventListener('click', () => {
            if (isPlaying) {
                bgMusic.pause();
                musicBtn.textContent = '🎵 Reproducir Música de Fondo';
            } else {
                bgMusic.play();
                musicBtn.textContent = '⏸️ Pausar Música';
            }
            isPlaying = !isPlaying;
        });
    }


    // ==========================================
    // 3. MINIJUEGO INTERACTIVO: SUDOKU LÓGICO
    // ==========================================
    const boardElement = document.getElementById('sudoku-board');
    const resetBtn = document.getElementById('reset-sudoku-btn');
    const messageElement = document.getElementById('sudoku-message');
    const vidasDisplay = document.getElementById('vidas-display');

    let vidas = 3;
    let gameOver = false;

    // Tablero inicial (0 significa celda vacía)
    const initialBoard = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];

    // Solución del tablero
    const solutionBoard = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ];

    function updateVidas() {
        if (vidas > 0) {
            vidasDisplay.textContent = 'Vidas: ' + '❤️'.repeat(vidas);
        } else {
            vidasDisplay.textContent = 'Vidas: 💔 (Juego Terminado)';
        }
    }

    function createBoard() {
        boardElement.innerHTML = '';
        messageElement.textContent = '';
        vidas = 3;
        gameOver = false;
        updateVidas();
        
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.classList.add('sudoku-cell');
                
                if (c === 2 || c === 5) input.classList.add('border-right');
                if (r === 2 || r === 5) input.classList.add('border-bottom');
                
                input.dataset.row = r;
                input.dataset.col = c;

                if (initialBoard[r][c] !== 0) {
                    input.value = initialBoard[r][c];
                    input.readOnly = true;
                } else {
                    input.value = '';
                    input.addEventListener('input', handleInput);
                }
                boardElement.appendChild(input);
            }
        }
    }

    function handleInput(e) {
        if (gameOver) {
            this.value = '';
            return;
        }

        this.value = this.value.replace(/[^1-9]/g, '');

        if (this.value === '') {
            this.classList.remove('error');
            return;
        }

        const r = this.dataset.row;
        const c = this.dataset.col;
        const val = parseInt(this.value);

        if (val === solutionBoard[r][c]) {
            this.classList.remove('error');
            this.readOnly = true; 
            checkWinCondition();
        } else {
            this.classList.add('error');
            vidas--;
            updateVidas();
            
            if (vidas <= 0) {
                gameOver = true;
                messageElement.textContent = "❌ Te quedaste sin vidas. Presiona Reiniciar para volver a jugar.";
                messageElement.style.color = "#ff3b30";
                
                // GUARDADO AUTOMÁTICO EN MONGODB AL PERDER
                registrarRecordEnMongoDB("Perdido");
                
                document.querySelectorAll('.sudoku-cell').forEach(cell => {
                    cell.readOnly = true;
                });
            }
        }
    }

    function checkWinCondition() {
        const inputs = document.querySelectorAll('.sudoku-cell');
        let isComplete = true;
        
        inputs.forEach(input => {
            if (input.value === '' || input.classList.contains('error')) {
                isComplete = false;
            }
        });

        if (isComplete) {
            gameOver = true;
            messageElement.textContent = "🎉 ¡Felicidades! Completaste el Sudoku.";
            messageElement.style.color = "#34c759";
            
            // GUARDADO AUTOMÁTICO EN MONGODB AL GANAR
            registrarRecordEnMongoDB("Ganado");
        }
    }
  
    async function registrarRecordEnMongoDB(resultadoFinal) {
        const nombre = prompt(`¡Juego Terminado (${resultadoFinal})! Introduce tu nombre para registrar tu marca en la base de datos NoSQL:`);
        const correo = prompt("Introduce tu correo electrónico:");

        if (!nombre || !correo) {
            alert("⚠️ No se registró el puntaje porque faltaron datos del usuario.");
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/puntajes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nombre,
                    correo: correo,
                    vidasRestantes: vidas, 
                    resultado: resultadoFinal
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert("🎯 Datos sincronizados correctamente en la colección 'puntaje' de MongoDB.");
            } else {
                alert(`⚠️ Error del servidor: ${data.error}`);
            }
        } catch (error) {
            console.error("Error al conectar con el backend:", error);
            alert("❌ No se pudo conectar con el servidor backend. Asegúrate de que 'node server.js' esté corriendo.");
        }
    }

    resetBtn.addEventListener('click', createBoard);
    createBoard();


    // ==========================================
    // 4. CONTROL DEL MODAL "CÓMO JUGAR"
    // ==========================================
    const howToBtn = document.getElementById('how-to-play-btn');
    const howToModal = document.getElementById('how-to-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (howToBtn && howToModal && closeModalBtn) {
        howToBtn.addEventListener('click', () => {
            howToModal.classList.add('show');
        });

        closeModalBtn.addEventListener('click', () => {
            howToModal.classList.remove('show');
        });

        window.addEventListener('click', (e) => {
            if (e.target === howToModal) {
                howToModal.classList.remove('show');
            }
        });
    }


    // =========================================================================
    // 5. CONEXIÓN DEL FORMULARIO DE CONTACTO CON EL SERVIDOR NODE.JS (MONGODB)
    // =========================================================================
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            // Capturamos los campos exactos de tu formulario Glassmorphism
            const nombre = document.getElementById('nombre').value;
            const correo = document.getElementById('correo').value;
            const consulta = document.getElementById('consulta').value;
            const mensaje = document.getElementById('mensaje').value;

            try {
                // Envío real mediante una petición POST al Servidor
                const response = await fetch('http://localhost:3000/api/contacto', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ 
                        nombre: nombre, 
                        correo: correo, 
                        consulta: consulta, 
                        mensaje: mensaje 
                    })
                });

                const data = await response.json();
                
                if (response.ok) {
                    alert(`🎉 ${data.mensaje}`); // Mostrará el mensaje de éxito enviado desde MongoDB
                    contactForm.reset(); // Vacía el formulario automáticamente tras guardarlo
                } else {
                    alert(`⚠️ Error en el servidor NoSQL: ${data.error}`);
                }
            } catch (error) {
                console.error("Error al enviar el formulario de contacto:", error);
                alert('❌ No se pudo conectar con el servidor de base de datos. Revisa si la terminal de Node ("node server.js") está encendida.');
            }
        });
    }

});