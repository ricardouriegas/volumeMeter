let localDbValues = [];
let refresh_rate = 80;
let color = 'black';
let stream;
let offset = 0;

// counter of time hearing more than 80 db
let timeHearing = 0;
let alertThreshold = 10; // Time threshold in seconds for alert

let interval; // Declare interval here

navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((audioStream) => {
    stream = audioStream;

    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(2048, 1, 1);
    const analyser = context.createAnalyser();

    // this is a property that controls how quickly the values in the 
    // analysis change over time
    analyser.smoothingTimeConstant = .9; 
    // This property sets the size of the FFT used for 
    // frequency-domain analysis. In this case, it's set to 512, 
    // meaning that the frequency data will be divided into 512 bins.
    // bigger the size, the more accurate the data and the slower the response
    analyser.fftSize = 512; 

    source.connect(analyser);
    analyser.connect(processor);
    processor.connect(context.destination);

    processor.onaudioprocess = () => {

        let data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let rms = 0;

        for (var i = 0; i < data.length; i++) {
            if (data[i] > 120) data[i] = 120
            rms += data[i] * data[i]
        }
        rms = Math.sqrt(rms / data.length);
        console.log("RMS: " + rms)

        offset = parseInt(document.getElementById("offset").value);
        document.getElementById("offset_value").innerText = offset;
        value = rms + offset;
        localDbValues.push(value);

        /* 
            Medical recomendations:
            80 - 85 dB - 2 hours
            95 dB - 50 minutes
            100 dB - 15 minutes
            105 - 110 dB - 5 minutes
            110 dB - 2 minutes
            >120 dB - Pain 
        */

        // Check if volume is higher than 80 dB
        if (rms > 80) {
            timeHearing += refresh_rate / 1000; // Increment timeHearing by refresh_rate in seconds

            // Check if timeHearing exceeds the threshold
            if (timeHearing >= alertThreshold) {
                // Show alert after 10 seconds
                if (rms >= 120) {
                    alert("Dolor");
                } else if (rms >= 110 && rms < 120) {
                    alert("Por recomendaciones médicas, no deberías escuchar este volumen por más de 2 minutos.");
                    alertThreshold = 120;
                } else if (rms >= 105 && rms < 110) {
                    alert("Por recomendaciones médicas, no deberías escuchar este volumen por más de 5 minutos.");
                    alertThreshold = 300;
                } else if (rms >= 100 && rms < 105) {
                    alert("Por recomendaciones médicas, no deberías escuchar este volumen por más de 15 minutos.");
                    alertThreshold = 900;
                } else if (rms >= 95 && rms < 100) {
                    alert("Por recomendaciones médicas, no deberías escuchar este volumen por más de 50 minutos.");
                    alertThreshold = 3000;
                } else if (rms >= 80 && rms < 95) {
                    alert("Por recomendaciones médicas, no deberías escuchar este volumen por más de 2 horas.");
                    alertThreshold = 7200;
                }
                timeHearing = 0; // Reset the timeHearing counter
            }
        } else {
            timeHearing = 0; // Reset the timeHearing counter if volume is below 80 dB
        }
    };
    // Initiate the setInterval after setting up the audio stream
    interval = window.setInterval(updateDb, refresh_rate);
});

// update the volume every refresh_rate m.seconds
let updateDb = function () {
    window.clearInterval(interval);

    const db = document.getElementById("db");

    if (localDbValues.length > 0) {
        let volume = Math.round(localDbValues.reduce((a, b) => a + b) / localDbValues.length);
        if (!isFinite(volume)) volume = 0;
        db.innerText = volume;
        changeColor(localDbValues);
    } else {
        db.innerText = "No data";
    }

    localDbValues = [];
    interval = window.setInterval(updateDb, refresh_rate);
}

interval = window.setInterval(updateDb, refresh_rate);



// change the visualization colors according to the dbValue
function changeColor(decibels) {
    // to write a reference sound to be compared with
    var referenceSound = document.getElementById("reference");

    // change the color of the text according to the decibels
    if (decibels < 50) {
        color = '#75FF33';
        document.getElementById("meter").querySelector("span").style.background = '#75FF33';
    } else if (decibels >=74 && decibels <90) {
        color = '#C70039'
        document.getElementById("meter").querySelector("span").style.background = '#C70039';
    } else if (decibels >= 91 && decibels <117) {
        color = '#d94121'
        document.getElementById("meter").querySelector("span").style.background = '#FF5733';
    } else if (decibels >= 118){
        color = '#5C0728'
        document.getElementById("meter").querySelector("span").style.background = '#900C3F';
    }

    /* 
        Reference sounds:
        20 dB - whispering
        30 dB - soft library
        40 dB - refrigerator hum
        50 dB - moderate rainfall
        60 dB - Quiet office
        70 dB - normal conversation
        75 dB - inside car
        80 dB - loud singing
        88 dB - automobile
        90 dB - motorcyle
        94 dB - food blender
        100 dB - subway train
        107 dB - rock concert
        115 dB - power mower
        117 dB - Pneumatic riveter
        120 dB - Chain saw
        130 dB - Amplified rock music
        140 dB - Jet plane
        165 dB - 12-gauge shotgun blast
        180 dB - Rocket launching pad
        194 dB - Loudest sound possible
    */
   // reference sound
    if (decibels >= 194) {
        referenceSound.innerText = "El sonido más fuerte posible";
    } else if (decibels <= 20) {
        referenceSound.innerText = "Susurro";
    } else if (decibels >= 165 && decibels < 180) {
        referenceSound.innerText = "Explosión de escopeta calibre 12";
    } else if (decibels >= 180 && decibels < 194) {
        referenceSound.innerText = "Plataforma de lanzamiento de cohetes";
    } else if (decibels >= 140 && decibels < 165) {
        referenceSound.innerText = "Avión a reacción";
    } else if (decibels >= 130 && decibels < 140) {
        referenceSound.innerText = "Música rock amplificada";
    } else if (decibels >= 120 && decibels < 130) {
        referenceSound.innerText = "Motosierra";
    } else if (decibels >= 117 && decibels < 120) {
        referenceSound.innerText = "Remachadora neumática";
    } else if (decibels >= 115 && decibels < 117) {
        referenceSound.innerText = "Cortacésped";
    } else if (decibels >= 107 && decibels < 115) {
        referenceSound.innerText = "Concierto de rock";
    } else if (decibels >= 100 && decibels < 107) {
        referenceSound.innerText = "Tren subterráneo";
    } else if (decibels >= 94 && decibels < 100) {
        referenceSound.innerText = "Licuadora";
    } else if (decibels >= 90 && decibels < 94) {
        referenceSound.innerText = "Motocicleta";
    } else if (decibels >= 88 && decibels < 90) {
        referenceSound.innerText = "Automóvil";
    } else if (decibels >= 80 && decibels < 88) {
        referenceSound.innerText = "Canto fuerte";
    } else if (decibels >= 75 && decibels < 80) {
        referenceSound.innerText = "Dentro del automóvil";
    } else if (decibels >= 70 && decibels < 75) {
        referenceSound.innerText = "Conversación normal";
    } else if (decibels >= 60 && decibels < 70) {
        referenceSound.innerText = "Oficina tranquila";
    } else if (decibels >= 50 && decibels < 60) {
        referenceSound.innerText = "Lluvia moderada";
    } else if (decibels >= 40 && decibels < 50) {
        referenceSound.innerText = "Sonido de refri";
    } else if (decibels >= 30 && decibels < 40) {
        referenceSound.innerText = "Biblioteca silenciosa";
    } else if (decibels >= 20 && decibels < 30) {
        referenceSound.innerText = "Susurro";
    } 

    document.getElementById("db").style.color = color;
}