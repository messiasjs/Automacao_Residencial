const { conversation } = require('@assistant/conversation');
const functions = require('firebase-functions');
//const admin = require('firebase-admin');
//admin.initializeApp();
var mqtt = require('mqtt');
var sleep = require('system-sleep');
const app = conversation();//intancia do assistente

//variaveis usasas na conexao com o mqtt
const HOST = 'broker.mqttdashboard.com';
const PORT = 1883;
var client = mqtt.connect("mqtt://"+HOST, {port: PORT});//conecta mqtt

var messages = [], resposta="Essa não é a resposta esperada, algo de errado aconteceu!", conexao, tempoNotificacao, msgAtualiza;
var cron, hour = 0, minute = 0, second = 0, millisecond = 0, controle=0;
var dispositivo= "Dispositivo desconectado", notificacoesD="", notifAlarme=[], notifDisp=[];


//Estrutura de topicos
const estadoLampada = "AutomacaoResidencial/Lampada/"; //+place;
const estadoArC = "AutomacaoResidencial/ArCondicionado/"; //+place;
const estadoAlarme = "AutomacaoResidencial/Alarme";
const configInterna = "AutomacaoResidencial/Configuracao/AmbienteInterno"; 
const configArC = "AutomacaoResidencial/Configuracao/ArCondicionado"; 
const configNotif = "AutomacaoResidencial/Configuracao/Notificacao";
const atualizacao = "AutomacaoResidencial/Atualizacao";

/*método chamado quando o mqtt está conectado*/
client.on('connect', function () {
  console.log('Connected to mqtt broker');
  client.subscribe("AutomacaoResidencial/Assistente/#");//increve no topico
  //client.subscribe("AutomacaoResidencial/#");
  conexao = "O assistente está conectado ao M Q T T!";
});

/*método chamnado quanto o mqtt está desconetado*/
client.on('disconnect', (e) => {
  messages.push("Você está desconectado");
  conexao = "O assistente está desconectado";
});

/*metodo chamado quando o mqtt fica offline*/
client.on('offline', (e) => {
  messages.push("O broker está offline");
  conexao = "O conexão M Q T T está offline!";
  //console.log(e);
});

/*meto chamado quando acontece um erro de conexao*/
client.on('error', (err) => {
  messages.push("Erro com o MQTT");
  conexao = "Erro com o M Q T T";
  //console.log(err);
});

/*metodo chamdo quando chega uma mensagem*/
client.on("message", (topic, msg) => {
  //console.log('Chegou uma mensagem: '+ msg +" no tópico: "+ topic);
  if(msg != "ASSISTENTE"){//se a mensagem for diferente significa que não é o eco (a mesma mensagem que foi enviada é recibida como confirmação)
    var conteudo = topic+"|"+msg;
    messages.push(conteudo);//adiciona na llista de mensagens
  	trataMensagens();//chama metodo que trata as mensagens
  }
});

/*Hanlder chamado quando a cena de iluminacao é invocada*/
app.handle('acenderLampada', conv => {
  const comodo = conv.session.params.comodo; //obtem o comodo
  const topico = estadoLampada + "'"+ comodo +"'"; //concatena o comodo ao tópico
  client.publish(topico,"ASSISTENTE");//publica a mesagem no tópico
	sleep(5000);
  conv.add(resposta);
});

/*Hanlder chamado quando a cena de ar-condicionado é invocada*/
app.handle('ligarAr', conv => {
  const comodo = conv.session.params.comodo; //obtem o comodo
  const topico = estadoArC + "'"+ comodo +"'"; //concatena o comodo ao tópico
  client.publish(topico, "ASSISTENTE");//publica a mesagem no tópico
  sleep(5000);
  conv.add(resposta);
});

/*Hanlder chamado quando a cena de alarme é invocada*/
app.handle('ativarAlarme', conv => {
  client.publish(estadoAlarme, "ASSISTENTE");//publica a mesagem no tópico
  sleep(5000);
  conv.add(resposta);
});

/*Hanlder chamado quando a cena de configurar tempo é invocada*/
app.handle('configurarTempo', conv => {
  //obtem os valores do tempo 
  var horaFinal = conv.session.params.horaFinal;
  var minFinal = conv.session.params.minutoFinal;
  var horaInicial = conv.session.params.horaInicial; 
  var minInicial = conv.session.params.minutoInicial;   
  
  if(!minInicial){
    minInicial="00";
  }
  if(!minFinal){
    minFinal="00";
  }
  client.publish(configInterna, horaInicial+":"+minInicial+"/"+horaFinal+":"+minFinal);//publica a mesagem no tópico //msg = horarioInicio+"/"+horarioFinal
  conv.add("Configuração de ambiente interno enviada!");//Adiciona a frase à conversa
});

/*Hanlder chamado quando a cena de configurar o ar é invocada*/
app.handle('configurarAr', conv => {
  const arMaximo = conv.session.params.temperaturaMax; //obtem a temperatura max
  const arMinimo = conv.session.params.temperaturaMin; //obtem a temperatura min
  const tempoEspera = conv.session.params.tempoEspera; //obtem o tempo de espera
  client.publish(configArC, arMaximo+"/"+arMinimo+"/"+tempoEspera);//publica a mesagem no tópico //msg= arMaximo+"/"+arMinimo+"/"+tempoEspera
  conv.add("Configuração do ar-condicionado enviada!");//Adiciona a frase à conversa
});

/*Hanlder chamado quando a cena de configurar tempo de notificacao é invocada*/
app.handle('configTempoNotif', conv => {
  const tempo = conv.session.params.tempo; //obtem a temperatura max
  client.publish(configNotif, tempo);//publica a mesagem no tópico
  conv.add("Configuração do tempo de notificação enviada!");//Adiciona a frase à conversa
});

/*Hanlder chamado quando a cena de estado do dispostivo é invocada*/
app.handle('estadoDispositivo', conv => {
  conv.add(dispositivo);//Adiciona a frase à conversa
});

/*Hanlder chamado quando a cena de verificar conexao é invocada*/
app.handle('verificarConexao', conv => {
  conv.add(conexao);//Adiciona a frase à conversa
});

/*Hanlder chamado quando a cena de notificacao é invocada*/
app.handle('notificacoes', conv => {
  var notf = "";
  if(notifDisp.length !=0){//Verifica se há notificacoes de dispostivo na lista
    notifDisp.forEach(function (item, indice, array) {
			notf += item;//adiciona a notificacao
		});
  }
  if(notifAlarme.length !=0){//Verifica se há notificacoes de alarme na lista
    notifAlarme.forEach(function (item, indice, array) {
			notf += item;//adiciona a notificacao
		});
  }
  if(notf == ""){//se não houver notificações
    notf = "Não há notificações!";
  }
  conv.add(notf);//Adiciona a frase com as notificacoes à conversa
});

/*Hanlder chamado quando a cena de estado geral da residencia é invocada*/
app.handle('statusGeral', conv => {
  client.publish(atualizacao, "Status do dispositivo");//publica a mesagem no tópico solicitando atualizacao
  sleep(5000);//aguarda mensagem
  dd = msgAtualiza.split(":");//obtem as atualizacoes do dispostivo
  dados = dd[1].split("/");
  var status="", qtd=0;
  dados.forEach(function (item, indice, array) {//concatenna os estados dos dispositivos
    if(item ==1){
      qtd +=1;
      if(indice ==0){
        status += "Alarme. ";
      } else if(indice ==1){
        status += "Ar-condicionado da sala. ";
      } else if(indice ==2){
        status += "Ar-condicionado do quarto 1. ";
      } else if(indice ==3){
        status += "Iluminação do jardim. ";
      } else if(indice ==4){
        status += "Luz da garagem. ";
      }else if(indice ==5){
        status += "Luz da sala. ";
      } else if(indice ==6){
        status += "Luz da cozinha. ";
      } else if(indice ==7){
        status += "Luz do quarto 1. ";
      } else if(indice ==8){
        status += "Luz do quarto 2. ";
      }else if(indice ==9){
        status += "Luz do quarto 3. ";
      } else if(indice ==10){
        status += "Luz do banheiro. ";
      } 
    }
  });
  if(qtd == 0){
    status ="Não há dispositivos ligados";
  }  else if(qtd == 1){
    status ="Há 1 dispositivo ligado:"+status;
  }  else{
    status = "Há "+qtd+" dispositivos ligados: "+status;
  }
  conv.add(status);//Adiciona a frase à conversa
});

/*Hanlder chamado quando a cena de estado do comodo é invocada*/
app.handle('statusComodo', conv => {
  const comodo = conv.session.params.comodo;
  var status;
  client.publish(atualizacao, "Status do dispositivo");//publica a mesagem no tópico
  sleep(5000);
  dd = msgAtualiza.split(":");
  dados = dd[1].split("/");
  
  //verifics o comodo que foi solicitado e armazena a informacao do estado
  if(comodo == "Jardim"){//3
    if(dados[3]==0){
      status = "A iluminação do Jardim está desligada!";
    } else{
      status = "A iluminação do Jardim está ligada!";
    }
  }
  else if(comodo == "Garagem"){//4
    if(dados[4]==0){
      status = "A luz da Garagem está apagada!";
    } else{
      status = "A luz da Garagem está acesa!";
    }
  }
  else if(comodo == "Sala"){//1 e 5
    if(dados[1]==0 && dados[5]==0){
      status = "O ar-condicionado e a luz estão desligados!";
    } else if(dados[1]==1 && dados[5]==1){
      status = "O ar-condicionado e a luz estão ligados!";
    } else if(dados[1]==1 && dados[5]==0){
      status = "O ar-condicionado está ligado!";
    } else{
      status = "A luz está acesa!";
    }
  }
  else if(comodo == "Cozinha"){//6
    if(dados[6]==0){
      status = "A luz da Cozinha está apagada!";
    } else{
      status = "A luz da Cozinha está acesa!";
    }
  }
  else if(comodo == "Quarto1"){//2 7
    if(dados[2]==0 && dados[7]==0){
      status = "O ar-condicionado e a luz estão desligados!";
    } else if(dados[2]==1 && dados[7]==1){
      status = "O ar-condicionado e a luz estão ligados!";
    } else if(dados[2]==1 && dados[7]==0){
      status = "O ar-condicionado está ligado!";
    } else{
      status = "A luz está acesa!";
    }
  }
  else if(comodo == "Quarto2"){//8 
    if(dados[8]==0){
      status = "A luz da Quarto 2 está apagada!";
    } else{
      status = "A luz da Quarto 2 está acesa!";
    }
  }
  else if(comodo == "Quarto3"){//9
    if(dados[8]==0){
      status = "A luz da Quarto 3 está apagada!";
    } else{
      status = "A luz da Quarto 3 está acesa!";
    }
  }
  else if(comodo == "Banheiro"){//10
    if(dados[8]==0){
      status = "A luz da Banheiro está apagada!";
    } else{
      status = "A luz da Banheiro está acesa!";
    }
  } else{
		status = "Cômodo não cadastrado no sistema!";
  }
  conv.add(status);
});

/*Funcao que trata as mesagens recebidas*/
function trataMensagens(){
  var conteudo, topic, message, dados;
    conteudo =  messages.shift();
    dado = conteudo.split("|");
    topic = dado[0];
    message = dado[1];
    //Verifica em qual tópico a mensagem chegou exibe e armazena a informação sobre o estado do dispostivo
    if (topic == "AutomacaoResidencial/Assistente/Lampada/'Jardim'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "A iluminação do Jardim está desligada!";
        } else if(Number(content[1])==1){
            resposta = "A iluminação do Jardim está ligada!";
        }
    } else if (topic == "AutomacaoResidencial/Assistente/Lampada/'Garagem'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "A luz da Garagem está apagada!";
        } else if(Number(content[1])==1){
            resposta = "A luz da Garagem está acesa!"; 
        }
    
    } else if (topic == "AutomacaoResidencial/Assistente/Lampada/'Sala'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "A luz da Sala está apagada!";
        } else if(Number(content[1])==1){
            resposta = "A luz da Sala está acesa!"; 
        }
    } else if (topic == "AutomacaoResidencial/Assistente/Lampada/'Cozinha'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "A luz da Cozinha está apagada!";
        } else if(Number(content[1])==1){
            resposta = "A luz da Cozinha está acesa!"; 
        } 
    } else if (topic == "AutomacaoResidencial/Assistente/Lampada/'Quarto1'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "A luz do Quarto 1 está apagada!";
        } else if(Number(content[1])==1){
            resposta = "A luz do Quarto 1 está acesa!"; 
        }
    } else if (topic == "AutomacaoResidencial/Assistente/Lampada/'Quarto2'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "A luz do Quarto 2 está apagada!";
        } else if(Number(content[1])==1){
            resposta = "A luz do Quarto 2 está acesa!"; 
        }
    } else if (topic == "AutomacaoResidencial/Assistente/Lampada/'Quarto3'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "A luz do Quarto 3 está apagada!";
        } else if(Number(content[1])==1){
            resposta = "A luz do Quarto 3 está acesa!"; 
        }
    } else if (topic == "AutomacaoResidencial/Assistente/Lampada/'Banheiro'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "A luz do Banheiro está apagada!";
        } else if(Number(content[1])==1){
            resposta = "A luz do Banheiro está acesa!"; 
        }
    } else if (topic == "AutomacaoResidencial/Assistente/ArCondicionado/'Sala'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "O ar-condicionado da Sala está desligado!";
        } else if(Number(content[1])==1){
            resposta = "O ar-condicionado da Sala está ligado!"; 
        }
    } else if (topic == "AutomacaoResidencial/Assistente/ArCondicionado/'Quarto1'") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "O ar-condicionado do Quarto 1 está desligado!";
        } else if(Number(content[1])==1){
            resposta = "O ar-condicionado do Quarto 1 está ligado!"; 
        }
    } else if (topic == "AutomacaoResidencial/Assistente/Alarme") {
        content = message.split(":");
        if(Number(content[1])==0){
            resposta = "O alarme está desativado!";
        } else if(Number(content[1])==1){
            resposta = "O alarme está ativado!"; 
        } 
    } else if (topic ==  "AutomacaoResidencial/Assistente/Atualizacao"){
      msgAtualiza = message;
    } else if (topic ==  "AutomacaoResidencial/Assistente/Alarme/Alerta"){
      notifAlarme.push(message);//adiciona mensagem no tópico de notificaco do alarme
    } else if(topic == "AutomacaoResidencial/Assistente/Monitoramento"){
      dispositivo = "Dispositivo conectado";
      content = message.split("/");
      dado = content[0].split(":");
      notificacoesD = content[1];
      tempoNotificacao = dado[1];//obtem o tmepo de notificacao
      monitora();//chama a funcao que monitora o tempo
      //reseta o contador do tempo
      hour=0;
  		minute=0;
			second=0;
    }
}

/*Funcao que chama ao timer, especificando o tempo em milisegundos*/
function monitora() {
  hour=0;
  minute=0;
	second=0;
	clearInterval(cron);
  cron = setInterval(() => { timer(); }, 1000);
}

/*Funcao que conta o tempo, como um cronometro, de 0 ate o tempo especificado*/
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
    if(minute == tempoNotificacao && second==0){//se chegou no tempo adiciona a mensagem na lista de notificaçoes
      console.log("Dispositivo desconectado");
      dispositivo = "Dispositivo desconectado";
      notifDisp.push(notificacoesD);
      console.log(notifDisp);
    }
  	//console.log("Tempo: "+hour+":"+minute+":"+second);
}
exports.ActionsOnGoogleFulfillment = functions.https.onRequest(app);
