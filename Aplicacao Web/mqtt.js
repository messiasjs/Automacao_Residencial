var connected_flag = 0
var mqtt; //Variável da instância do cliente mqtt
var reconnectTimeout = 2000;
var host; //Variável do endereço do broker
var port; //Variável da porta do broker
var clienteID; //Variável de identificação do cliente
var dispositivo=0, tempoNotificacao=1;
let cron, hour = 0, minute = 0, second = 0, millisecond = 0;


/*Quando a conexão é perdida, exibe o status*/
function onConnectionLost() {
    console.log("Conexão perdida");
    document.getElementById("status").innerHTML = "MQTT - Conexão perdida";
    connected_flag = 0;
}

/*Quando não consegue se conectar, exibe o status*/
function onFailure(message) {
    console.log("Falhou");
    document.getElementById("status").innerHTML = "MQTT - Falha na conexão";
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
    } else if (topic == "AutomacaoResidencial/Alarme/Alerta") {
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        //changeColor(message);
        content = message.split(":");
        if(Number(content[1])==0){
            document.getElementById("alarme").style.color = "white"; 
        } else {
            document.getElementById("alarme").style.color = "red"; 
        } 
    } else if (topic ==  "AutomacaoResidencial/Monitoramento"){
        
        document.getElementById("status_dis").innerHTML = "Dispositivo conectado";
        document.getElementById("status_dis").style.color = "rgb(1, 223, 1)";
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        content = message.split(":");
        tempoNotificacao = content[1];
        monitora();
        hour = 0, minute = 0, second = 0, millisecond = 0;

    } else if (topic ==  "AutomacaoResidencial/Atualiza"){
        
        message= String.fromCharCode.apply(null, new Uint8Array(r_message.payloadBytes));
        console.log(message);
        estados = message.split(":");
        content = estados[1].split("/");
        if(Number(content[0])==0){
            document.getElementById("alarme").style.color = "white"; 
        } else if(Number(content[0])==1){
            document.getElementById("alarme").style.color = "rgb(1, 223, 1)"; 
        } else if(Number(content[0])<0){
            document.getElementById("alarme").style.color = "red"; 
        } 
        if(Number(content[1])==0){
            document.getElementById("salaAr").style.color = "white"; 
        } else if(Number(content[1])==1){
            document.getElementById("salaAr").style.color = "#4DC3FA"; 
        }
        if(Number(content[2])==0){
            document.getElementById("quarto1Ar").style.color = "white"; 
        } else if(Number(content[2])==1){
            document.getElementById("quarto1Ar").style.color = "#4DC3FA"; 
        }
        if(Number(content[3])==0){
            document.getElementById("jardim").style.color = "white"; 
        } else if(Number(content[3])==1){
            document.getElementById("jardim").style.color = "yellow"; 
        }
        if(Number(content[4])==0){
            document.getElementById("garagem").style.color = "white"; 
        } else if(Number(content[4])==1){
            document.getElementById("garagem").style.color = "yellow"; 
        }
        console.log(content[5]);
        if(Number(content[5])==0){
            document.getElementById("sala").style.color = "white"; 
        } else if(Number(content[5])==1){
            document.getElementById("sala").style.color = "yellow"; 
        }
        console.log(content[6]);
        if(Number(content[6])==0){
            document.getElementById("cozinha").style.color = "white"; 
        } else if(Number(content[6])==1){
            document.getElementById("cozinha").style.color = "yellow"; 
        } 
        if(Number(content[7])==0){
            document.getElementById("quarto1").style.color = "white"; 
        } else if(Number(content[7])==1){
            document.getElementById("quarto1").style.color = "yellow"; 
        }  
        if(Number(content[8])==0){
            document.getElementById("quarto2").style.color = "white"; 
        } else if(Number(content[8])==1){
            document.getElementById("quarto2").style.color = "yellow"; 
        } 
        if(Number(content[9])==0){
            document.getElementById("quarto3").style.color = "white"; 
        } else if(Number(content[9])==1){
            document.getElementById("quarto3").style.color = "yellow"; 
        }   
        if(Number(content[10])==0){
            document.getElementById("banheiro").style.color = "white"; 
        } else if(Number(content[10])==1){
            document.getElementById("banheiro").style.color = "yellow"; 
        }
    }
}

/*Funcao que altera cor da lampada */
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

/*Funcao chamada quando esta conectado */
function onConnect() {
    
    connected_flag = 1
    console.log("On Connect " + connected_flag);
    // Assim que a conexão é feita, se inscreve nos tópicos.
    document.getElementById("status").innerHTML = "MQTT - Conectado";
    mqtt.subscribe("AutomacaoResidencial/#");//increve no topico geral

}

/*Função responsável pela conexão*/
function MQTTconnect() {
    
        host = "broker.mqttdashboard.com";
        port = 8000;
        
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



/*Funcao que envia solicitacao para mudar esrado da lampada */
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

/*Funcao que envia solicitacao para mudar estado do sensor*/
function change_sensor_state(place){
    if (connected_flag == 1) {
        //message1 = new Paho.MQTT.Message("\n\tMudar estado da lâmpada:"+place+"\n\n");
        message1 = new Paho.MQTT.Message("SENSOR"); 
        message1.destinationName = "AutomacaoResidencial/Sensor/"+place; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou "+message1.destinationName);
        if(document.getElementById(place).style.color == "black"){
            document.getElementById(place).style.color = "white";
        } else{
            document.getElementById(place).style.color = "black"
        }
    }
    return false;
}

/*Funcao que envia solicitacao para mudar estado do ar-condicionado*/
function change_airc_state(place){
    if (connected_flag == 1) {
        message1 = new Paho.MQTT.Message("AR"); //Cria uma nova mensagem
        message1.destinationName = "AutomacaoResidencial/ArCondicionado/"+place; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou"+message1.destinationName);
    }
    return false;
}

/*Funcao que envia solicitacao para mudar estado do alarme */
function change_alarm_state(){
    if (connected_flag == 1) {
        message1 = new Paho.MQTT.Message("ALARME"); //Cria uma nova mensagem
        message1.destinationName = "AutomacaoResidencial/Alarme"; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou"+message1.destinationName);
    }
    return false;
}

/*Funcao que envia configuracao para ambiente interno */
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

/*Funcao que envia configuracao do ar-condicionado */
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

/*Funcao que envia configuracao do tempo de notificacao */
function send_notif_configuration(){
    tempoNotificacao = document.getElementById("tempoNotificacao").value;
    if (connected_flag == 1) {
        message1 = new Paho.MQTT.Message(tempoNotificacao); //Cria uma nova mensagem
        message1.destinationName = "AutomacaoResidencial/Configuracao/Notificacao"; //Define o tópico no qual vai publicar
        mqtt.send(message1);//Envia mensagem
        console.log("Enviou"+message1.destinationName);
    }
    return false;
}

/*Funcao que envia solicitacao para atualizar */
function atualiza(){
    setTimeout(() => { 
        if (connected_flag == 1) {
            message1 = new Paho.MQTT.Message("Aplicacao Web conectada"); //Cria uma nova mensagem
            message1.destinationName = "AutomacaoResidencial/Atualizacao"; //Define o tópico no qual vai publicar
            mqtt.send(message1);//Envia mensagem
            console.log("Enviou "+message1.destinationName);
        }  
    }, 1000);
}

/*Funcao que chamar o timer para cronometrar o tempo */
function monitora() {
    hour = 0, minute = 0, second = 0, millisecond = 0;
    clearInterval(cron);
    cron = setInterval(() => { timer(); }, 1000);
}

/*Funcao conta o tempo até atingir o tempo da notificacao */
function timer() {
    second++;
    if (second == 60) {
        second = 0;
        minute++;
    }
    if (minute == 60) {
        minute = 0;
        hour++;
    }

    if(minute >= tempoNotificacao){
       document.getElementById("status_dis").innerHTML = "Dispositivo desconectado!";
       document.getElementById("status_dis").style.color = "red";

    }
}