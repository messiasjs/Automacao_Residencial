var connected_flag = 0
var mqtt; //Variável da instância do cliente mqtt
var reconnectTimeout = 2000;
var host; //Variável do endereço do broker
var port; //Variável da porta do broker
var clienteID; //Variável de identificação do cliente


/*Quando a conexão é perdida, exibe o status*/
function onConnectionLost() {
    console.log("Conexão perdida");
    connected_flag = 0;
}

/*Quando não consegue se conectar, exibe o status*/
function onFailure(message) {
    console.log("Falhou");
    //setTimeout(MQTTconnect, reconnectTimeout);
}

/*Executada toda vez que uma mensagem chega*/
function onMessageArrived(r_message) {
    //console.log("Mensagem recebida: "+r_message.destinationName+": "+String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes))); //imprime no console do navegador a mensagem recebida
    var message, content;
    var topic = r_message.destinationName; //Separa o tópico em uma variável

    //Verifica em qual tópico a mensagem chegou exibe e altera a cor do simbolo
    if (topic == "AutomacaoResidencial/Lampada/'Jardim'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("jardim").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("jardim").style.color = "yellow"; 
        }
    } else if (topic == "AutomacaoResidencial/Lampada/'Garagem'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("garagem").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("garagem").style.color = "yellow"; 
        }
    
    } else if (topic == "AutomacaoResidencial/Lampada/'Sala'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("sala").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("sala").style.color = "yellow"; 
        }
    } else if (topic == "AutomacaoResidencial/Lampada/'Cozinha'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("cozinha").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("cozinha").style.color = "yellow"; 
        }  
    } else if (topic == "AutomacaoResidencial/Lampada/'Quarto1'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("quarto1").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("quarto1").style.color = "yellow"; 
        }  
    } else if (topic == "AutomacaoResidencial/Lampada/'Quarto2'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("quarto2").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("quarto2").style.color = "yellow"; 
        }  
    } else if (topic == "AutomacaoResidencial/Lampada/'Quarto3'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("quarto3").style.color = "white"; 
        } else{
            document.getElementById("quarto3").style.color = "yellow"; 
        }
    } else if (topic == "AutomacaoResidencial/Lampada/'Banheiro'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("banheiro").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("banheiro").style.color = "yellow"; 
        }
    } else if (topic == "AutomacaoResidencial/ArCondicionado/'Sala'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("salaAr").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("salaAr").style.color = "#4DC3FA"; 
        }
    } else if (topic == "AutomacaoResidencial/ArCondicionado/'Quarto1'") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("quarto1Ar").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("quarto1Ar").style.color = "#4DC3FA"; 
        }
    } else if (topic == "AutomacaoResidencial/Alarme") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("alarme").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("alarme").style.color = "rgb(1, 223, 1)"; 
        } else if(Number(content[1])<0){
            document.getElementById("alarme").style.color = "red"; 
        } 
    }   
}

function changeLampColor(element, message){
    content = message.split(":");
    if(Number(content[1])==0){
        document.getElementById(element).style.color = "white"; 
    } else{
        document.getElementById(element).style.color = "yellow"; 
    }
}

function onConnected(recon, url) {
    console.log(" In onConnected " + reconn);
}

function onConnect() {
    
    connected_flag = 1
    console.log("On Connect " + connected_flag);
    // Assim que a conexão é feita, se inscreve nos tópicos.
    mqtt.subscribe("AutomacaoResidencial/#");
}

/*Função responsável pela conexão*/
function MQTTconnect() {
    
        host = "broker.mqttdashboard.com";
        port = 1883;
        
        /*host="test.mosquitto.org";
        port = 8080;*/

        console.log("Conectando a " + host + " " + port);
        mqtt = new Paho.MQTT.Client(host, port, "AutomacaoResidencialWeb"); //Cria um novo cliente e coloca na variável mqtt  ws://test.mosquitto.org:1883/mqtt
        
        var options = { //Define opções para o cliente mqtt
            timeout: 3,
            onSuccess: onConnect,
            onFailure: onFailure,
        };

        mqtt.onConnectionLost = onConnectionLost;
        mqtt.onMessageArrived = onMessageArrived;
        mqtt.connect(options); //Se conecta ao broker
        return false;
    
}


function send_message(){
    if (connected_flag == 1) {
        message1 = new Paho.MQTT.Message("\n\tHello World\n\n"); //Cria uma nova mensagem
        message1.destinationName = "AutResi"; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou");
    }
    return false;
}

function change_lamp_state(place){
    if (connected_flag == 1) {
        //message1 = new Paho.MQTT.Message("\n\tMudar estado da lâmpada:"+place+"\n\n");
        message1 = new Paho.MQTT.Message("ILUMINACAO"); 
        message1.destinationName = "AutomacaoResidencial/Lampada/"+place; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou "+message1.destinationName);
    }
    return false;
}

function change_airc_state(place){
    if (connected_flag == 1) {
        message1 = new Paho.MQTT.Message("AR"); //Cria uma nova mensagem
        message1.destinationName = "AutomacaoResidencial/ArCondicionado/"+place; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou"+message1.destinationName);
    }
    return false;
}


function change_alarm_state(){
    if (connected_flag == 1) {
        message1 = new Paho.MQTT.Message("ALARME"); //Cria uma nova mensagem
        message1.destinationName = "AutomacaoResidencial/Alarme"; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou"+message1.destinationName);
    }
    return false;
}

function send_internal_configuration(){
    horarioInicio = document.getElementById("AIinicio").value;
    horarioFinal = document.getElementById("AIfinal").value;
    if (connected_flag == 1) {
        message1 = new Paho.MQTT.Message(horarioInicio+"/"+horarioFinal); //Cria uma nova mensagem
        message1.destinationName = "AutomacaoResidencial/Configuracao/AmbienteInterno"; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou"+message1.destinationName);
    }
    return false;
}

function send_airc_configuration(){
    arMaximo = document.getElementById("ArMaximo").value;
    arMinimo = document.getElementById("ArMinimo").value;
    tempoEspera = document.getElementById("TempoEspera").value;
    if (connected_flag == 1) {
        message1 = new Paho.MQTT.Message(arMaximo+"/"+arMinimo+"/"+tempoEspera); //Cria uma nova mensagem
        message1.destinationName = "AutomacaoResidencial/Configuracao/ArCondicionado"; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou"+message1.destinationName);
    }
    return false;
}
