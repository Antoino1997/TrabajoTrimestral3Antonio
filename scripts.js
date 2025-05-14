// Variables globales

let currentQuestion = 0;          // Índice de la pregunta que se está mostrando actualmente
let totalQuestions = 0;           // Total de preguntas que tiene el cuestionario
let timerInterval;                // Referencia al intervalo del cronómetro (setInterval)
let seconds = 0;                  // Tiempo transcurrido en segundos
let score = 0;                    // Puntuación obtenida por el usuario
let selectedLanguage = 'es';      // Idioma actual de la interfaz (por defecto: español)
let xmlDoc;                       // Documento XML cargado que contiene las preguntas
let answeredQuestions = 0;        // Contador de preguntas respondidas
let userAnswers = [];             // Array que guarda la respuesta seleccionada por el usuario en cada pregunta

// Diccionario con los textos traducidos para español e inglés
// Lo uso para poder luego añadir dinámicamente las traducciones a las expresiones definidas en la construcción del HTML

const translations = {
    es: { // Español
        title: "Prueba sobre Minecraft",
        languageLabel: "Idioma:",
        timeLabel: "Tiempo",
        questionNumber: "Pregunta",
        questionRelation: "de",
        previous: "Pregunta anterior",
        next: "Siguiente pregunta",
        submit: "Enviar respuestas",
        finished: "Tu puntuación es:"
    },
    en: { // Inglés
        title: "Test about Minecraft",
        languageLabel: "Language:",
        timeLabel: "Time",
        questionNumber: "Question",
        questionRelation: "of",
        previous: "Previous question",
        next: "Next question",
        submit: "Submit answers",
        finished: "Your score is:"
    }
};

// Función que cambia el idioma y reinicia el test

function changeLanguage() {
    selectedLanguage = document.getElementById('language').value;                           // Leer idioma seleccionado del <select>
    currentQuestion = 0;                                                                    // Reiniciar a la primera pregunta
    score = 0;                                                                              // Reiniciar puntuación
    answeredQuestions = 0;                                                                  // Reiniciar contador
    seconds = 0;                                                                            // Reiniciar cronómetro
    userAnswers = [];                                                                       // Vaciar respuestas anteriores
    document.getElementById('score').innerHTML = '';                                        // Limpiar resultado anterior
    clearInterval(timerInterval);                                                           // Detener cronómetro si está activo
    applyTranslations();                                                                    // Aplicar textos traducidos
    loadQuestions();                                                                        // Cargar preguntas desde XML
}

// Función para actualizar la interfaz con los textos del idioma actual

function applyTranslations() {
    const t = translations[selectedLanguage];                                               // Obtener traducciones según idioma
    document.querySelector("header h1").textContent = t.title;                              // Título
    document.querySelector("label[for='language']").textContent = t.languageLabel;          // Etiqueta del selector de idioma
    document.getElementById("timer").textContent = `${t.timeLabel}: 00:00`;                 // Temporizador en 00:00
}

// Cargar preguntas desde un archivo XML dependiendo del idioma

function loadQuestions() {
    const fileName = selectedLanguage === 'es' ? 'questions_es.xml' : 'questions_en.xml';   // Archivo según idioma (Usa un operador terniario o condicional)

    fetch(fileName)                                                                         // Leer archivo XML haciendo una solicitud HTTP GET
        .then(response => response.text())                                                  // Convierte el archivo xml a una cadena de texto
        .then(data => {
            const parser = new DOMParser();                                                 // Crear un parser XML (Convierte la cadena de texto a un objeto DOM para que javascript lo pueda manipular)
            xmlDoc = parser.parseFromString(data, 'text/xml');                              // Parsear el XML (Aquí es donde verdaderamente se hace la función parser; text/xml indica que esta parseando un archivo xml)
            totalQuestions = xmlDoc.getElementsByTagName('question').length;                // Contar preguntas (Con length obtenemos el número total de elementos, en este caso preguntas)
            displayQuestion();                                                              // Mostrar la primera pregunta
            startTimer();                                                                   // Iniciar cronómetro
        })
        .catch(error => {
            console.error('Error al cargar el archivo XML:', error);                        // Mostrar error en consola si falla (Me fallaba varias veces y tuve que llamar a la consola)
        });
}

// Mostrar la pregunta actual y sus opciones

function displayQuestion() {

    const t = translations[selectedLanguage];                                               // Traducciones actuales dependiendo del lenguaje seleccionado
    const question = xmlDoc.getElementsByTagName('question')[currentQuestion];              // Obtener la pregunta actual accediendo al xmlDoc y encontrando el índice de la pregunta en la que estamos situados
    const wording = question.getElementsByTagName('wording')[0].textContent;                // Enunciado de la pregunta. Primero selecciona el primer elemento "wording" y luego extrae su contenido de texto
    const choices = question.getElementsByTagName('choices')[0];                            // Opciones de la pregunta. Lo mismo que con el enunciado solo que al ser "choices" un grupo, extrae todo su interior, es decir, "choice"

    // Crear HTML con el inicio de una cadena de texto que va a contener el código HTML, en este caso, la pregunta

    let questionHtml = `<div class="question">`;

    // Número de la pregunta y total de preguntas (currentQuestion necesita añadir "1" al propio número que devuelva ya que esta contruido sobre un índice de base 0,
    // mientras que totalQuestions no es necesario ya que .length devuelve el número total de elementos, en el caso de este trabajo, 20 preguntas)

    const questionNumberHtml = `<p class="question-number">${t.questionNumber} ${currentQuestion + 1} ${t.questionRelation} ${totalQuestions}</p>`;

    // Insertar el número de la pregunta actual y el número total de preguntas al DOM para su visualización

    document.getElementById('question-number-container').innerHTML = questionNumberHtml;

    // Mostrar el título de la pregunta mediante la variable "wording"

    questionHtml += `<h2>${wording}</h2>`;

    // Crear el formulario de opciones

    questionHtml += `<form id="question-form">`;

    // Recorrer y mostrar cada opción mediante la conversión de la lista de nodos "choice" a un array y posterior recorrido de cada opción mediante forEach y se le asigna a un índice
    // No hay que hacer (index + 1) como en el caso de (currentQuestion + 1) ya que al ser un formulario de tipo radio no se va a ver ningún número
    // En caso de hacerlo estilo 1. 2. 3. 4. si habría que añadirle un + 1 al índice o si no aparecería estilo 0. 1. 2. 3.

    Array.from(choices.getElementsByTagName('choice')).forEach((choice, index) => {
        const choiceText = choice.textContent; // Obtiene el contenido de la respuesta del nodo "choice" actual

        // Marcar si ya estaba seleccionada haciendo una comparación con la respuesta seleccionada por el usuario
        // Esta comparación tiene más sentido luego ya que permito la declaración de una variable "vacía" donde al seleccionar una respuesta esta se guarda en la variable por si se quiere volver a una pregunta anterior
        // Así no es necesario volverla a marcar ya que al volver a la pregunta la opción que marcamos anteriormente estará marcada

        const isChecked = userAnswers[currentQuestion] === index;

        // Construir el HTML con un formulario que tenga "inputs" de tipo radio.
        // Además guardamos el value al índice para que la opción se quede marcada en caso de que el usuario vaya a otra pregunta y luego vuelva
        // Esto se hace haciendo uso de un operador condicional en el que si la respuesta es la que hemos marcado se le asignará el atributo "checked" y en caso de que no haya sido la que hayamos marcado pues no estará marcada

        questionHtml += `
            <label>
                <input type="radio" name="answer" value="${index}" ${isChecked ? 'checked' : ''}>
                ${choiceText}
            </label><br>`;
    });

    // Cierre del formulario y del contenedor

    questionHtml += `</form></div>`;

    // Inicio de una variable que contendrá el HTML con los botones de navegación

    let navigationHtml = '';

    // Si no es la primera pregunta se añade el botón de pregunta anterior
    // Esto se hace para que si es la primera pregunta solo aparezca el botón de siguiente pregunta

    if (currentQuestion > 0) {
        navigationHtml += `<button id="previous-btn" class="nav-button" onclick="previousQuestion()">${t.previous}</button>`;
    }

    // Lo mismo que antes pero si no es la última pregunta entonces se le añade el botón de siguiente pregunta
    // Esto se hace para que si es la última pregunta solo aparezca el botón de pregunta anterior

    if (currentQuestion < totalQuestions - 1) {
        navigationHtml += `<button id="next-btn" class="nav-button" onclick="nextQuestion()">${t.next}</button>`;
    }

    // Se añade el HTML de navegación al contenedor questionHTML si corresponde

    questionHtml += navigationHtml;

    // Por último se inserta el código HTML generado en el contenedor con id "quiz-container"

    document.getElementById('quiz-container').innerHTML = questionHtml;
}

// Pasar a la siguiente pregunta

function nextQuestion() {

    // Estas dos constantes no son necesarias para pasar a la siguiente pregunta, pero se requiere si queremos mostrar la respuesta que hemos seleccionado y que esta guardada en el índice
    // Esto se logra buscando con querySelector la respuesta que hemos marcado como "checked"
    // En caso de no haber seleccionado ninguna devolverá un valor null que significa que no se marcará ninguna como marcada, es decir, no habríamos marcado ninguna previamente

    const form = document.getElementById('question-form');
    const selectedAnswer = form.querySelector('input[name="answer"]:checked');

    // Al darle al botón de siguiente pregunta, mira si hemos seleccionado alguna de las respuestas y, de haberlo hecho,
    // Lo guarda en el array "userAnswer" para la pregunta en la que estabamos. Lo guarda como un número entero con
    // parseInt para evitar problemas

    if (selectedAnswer) {
        userAnswers[currentQuestion] = parseInt(selectedAnswer.value);
    }

    // Se le añade 1 al valor de currentQuestion

    currentQuestion++;

    // Esta parte la uso para evitar que se intente mostrar una pregunta fuera de rango, Ej: pregunta 21 que no existe
    // Aunque anteriormente hemos hecho que si es la pregunta nº20 no se muestre el botón de siguiente pregunta
    // Es solo por seguridad y para llamar a la función que muestre la siguiente pregunta de una manera sencilla

    if (currentQuestion < totalQuestions) {
        displayQuestion();
    }
}

// Volver a la pregunta anterior


function previousQuestion() {

    // Aquí hacemos exactamente lo mismo que nextQuestion simplemente que le sustraemos 1 a currentQuestion en vez de añadirle 1
    // En este caso metemos el "currentQuestion--" dentro del "if" para evitar la posible aparición de un número negativo,
    // Aunque no será posible que pase ya que si estamos en la pregunta 1 (Índice 0) no se mostrará el botón de pregunta anterior
    // Pero es simplemente por seguridad

    const form = document.getElementById('question-form');
    const selectedAnswer = form.querySelector('input[name="answer"]:checked');

    if (selectedAnswer) {
        userAnswers[currentQuestion] = parseInt(selectedAnswer.value);
    }

    if (currentQuestion > 0) {
        currentQuestion--;
        displayQuestion();
    }
}

// Mostrar el botón para enviar respuestas

function showSubmitButton() {

    // Obtenemos las traducciones para el idioma seleccionado

    const t = translations[selectedLanguage];

    // Se crea el código HTML que contiene el botón

    const navigationHtml = `
        <button id="submit-btn" onclick="submitAnswers()">${t.submit}</button>
    `;

    // Se inserta el botón al contenedor principal "quiz-container"

    document.getElementById('quiz-container').innerHTML += navigationHtml;
}

// Enviar las respuestas y calcular puntuación

function submitAnswers() {

    // En estas dos primeras constantes e "if" hacemos lo mismo que en "nextQuestion" y "previousQuestion", es decir, llamamos al formulario,
    // con un "querySelector" seleccionamos la respuesta que hemos marcado y la guardamos en el array "userAnswers"
    // Esto lo hacemos para que en el caso de darle al botón de enviar respuestas podamos guardar la respuesta que hemos seleccionado y usarla
    // Para calcular la puntuación posteriormente

    const form = document.getElementById('question-form');
    const selectedAnswer = form.querySelector('input[name="answer"]:checked');

    if (selectedAnswer) {
        userAnswers[currentQuestion] = parseInt(selectedAnswer.value);
    }

    // Obtenemos las traducciones del idioma actual y se las asignamos a la constante "t"
    // Además reiniciamos el puntuaje para que siempre la suma sea limpia

    const t = translations[selectedLanguage];
    score = 0;

    // Comparar respuestas seleccionadas con las correctas. Esto se hace recorriendo cada elemento del array "userAnswers" con el método forEach

    userAnswers.forEach((selectedIndex, index) => {
        const question = xmlDoc.getElementsByTagName('question')[index];                    // Obtenemos el nodo correspondiente a la pregunta del xmlDoc usando index
        const choices = question.getElementsByTagName('choices')[0];                        // Obtenemos el nodo "choices" actual. Usamos [0] para seleccionar el primer nodo "choices" en caso de que hubiera más de uno
        const correctChoiceIndex = Array.from(choices.getElementsByTagName('choice'))       // Genera un array de una colección de nodos para poder usar el método "findIndex()"
            .findIndex(choice => choice.getAttribute('correct') === 'yes');                 // Busca el índice de la opción correcta

        if (selectedIndex === correctChoiceIndex) {                                         // Si el índice de la respuesta que seleccionamos es igual al de la respuesta correcta, suma 1 a la puntuación
            score++;
        }
    });

    // Una vez que se han recorrido todas las respuestas que el usuario había seleccionado y se ha calculado la puntuación, mostramos el resultado final
    // Esto lo hacemos llamando al contenedor con el id "score" que es donde vamos a actualizar el contenido de este con "innerHTML"

    const scoreContainer = document.getElementById('score');
    scoreContainer.innerHTML = `${t.finished} ${score} ${selectedLanguage === 'es' ? 'de' : 'out of'} ${totalQuestions}.`;

    // Desactivamos los botones de navegación ya que el test ha finalizado

    document.getElementById('previous-btn')?.setAttribute('disabled', 'true');
    document.getElementById('next-btn')?.setAttribute('disabled', 'true');
    document.getElementById('submit-btn')?.setAttribute('disabled', 'true');

    // Desactivamos el cronómetro

    clearInterval(timerInterval);
}

// Iniciar cronómetro que actualiza cada segundo

function startTimer() {
    const timerElement = document.getElementById('timer');                                  // Se llama al contenedor que tiene el id "timer"

    // Lo siguiente es hacer un cronómetro que se actualice cada segundo, esto lo conseguimos con la función setInterval, que ejecuta un bloque de código
    // En un intervalo que se tiene que especificar. En este caso el intervalo es de 1000ms o mejor dicho 1 segundo

    timerInterval = setInterval(() => {
        seconds++;                                                                          // Cada segundo que pasa le añadimos 1 a los segundos del cronómetro
        const minutes = Math.floor(seconds / 60);                                           // Dividimos los segundos entre 60 y lo redondemoas hacia abajo con la función Math.floor
        const secs = seconds % 60;                                                          // Devuelve el resto de la división entre 60 y este serán los segundos actuales luego de haber hecho el cálculo de los minutos
        const t = translations[selectedLanguage];                                           // Traducciones

        // En esta parte he usado un operador terniario o condicional para que si los minutos y los segundos son menos de 10, se le añade un 0 antes del número, es decir, en vez de mostrar 5 en los segundos, muestra 05
        // Y lo mismo pasaría con los minutos, en vez de mostrar 9 minutos, mostraría 09. Esto lo uso más que nada por estética

        timerElement.textContent = `${t.timeLabel}: ${minutes < 10 ? '0' + minutes : minutes}:${secs < 10 ? '0' + secs : secs}`;
    }, 1000); // Cada 1000ms (1 segundo)
}

// Ejecutar automáticamente al cargar la página

window.onload = function () {
    applyTranslations();                                                                    // Traducir textos iniciales
    loadQuestions();                                                                        // Cargar preguntas del XML
};