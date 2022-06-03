#include <stdio.h>
#include <stdlib.h>
#include <string.h> 
#include <stdbool.h> 
#include <unistd.h>
#include <time.h>
#include <pthread.h>
#include "MQTTClient.h"
#include <mysql/mysql.h>

#define ADDRESS     "test.mosquitto.org"
#define CLIENTID    "CAutResi2021"

MQTTClient client;
MYSQL conexao;
FILE *pont_arq; // cria variável ponteiro para o arquivo

//Sensores de presença, sensor=0 sem presença
int sensorPresencaGaragem=0, sensorPresencaSala=0, sensorPresencaCozinha=0, sensorPresencaQuarto1=0;
int sensorPresencaQuarto2=0, sensorPresencaQuarto3=0, sensorPresencaBanheiro=0;
  
int sensorPortaAberta=0, sensorJanelaAberta=0; //Sensor = 0 porta/janela fechada
  
//Estado = 0 -> dispositivo desligado | Estado do alarme <0 -> há intrusos | Estado do alarme >0 -> Ligado
int estadoAlarme=0, estadoArCondicionadoSala=0, estadoArCondicionadoQuarto1=0, estadoIluminacaoJardim=0,  estadoIluminacaoGaragem=0,  estadoIluminacaoSala=0;
int estadoIluminacaoCozinha=0, estadoIluminacaoQuarto1=0,  estadoIluminacaoQuarto2=0,  estadoIluminacaoQuarto3=0,  estadoIluminacaoBanheiro=0;

// variaves para configurar o ttempo e a temperatura do ar
int horaINI=18, minutoINI=00, segundoINI=-1,horaFIM=06, minutoFIM=00, segundoFIM=-1;
int temperaturaMAX=25, temperaturaMIN=17, tempoEspera=5, temperaturaExterna=24, temperaturaInterna=25;
int tempoNotificacao =1;	 
	 
//declaracao de funcoes
void publish(MQTTClient client, char* topic, char* payload);
int on_message(void *context, char *topicName, int topicLen, MQTTClient_message *message);
void iluminacao(char* comodo);
void altera_estado_dispositivo(char *topicName);
void atualiza();
void salva_log(char *acao);

/*Funcao que sera exucutada pela thread para controlar o alarme. Sempre verifica se ha intrusos e emite o alerta caso positivo*/
void *controlador_interno_alarme(){//função a ser executada quando uma thread for criada

	struct tm *data_hora_atual; //Ponteiro para struct que armazena data e hora      
	time_t segundos; //Variável do tipo time_t para armazenar o tempo em segundos
	int minutoOcorrencia, diferenca=10;
	
	while(1){
		//verifica se passaram 10 minutos da ultima ocorrência
		if(diferenca>=10){
			//se o alarme esta ligado, há uma porta ou janela aberta e presençca na casa, aciona o alarme
			if(estadoAlarme==1 && (sensorPortaAberta==1 || sensorJanelaAberta==1) && (sensorPresencaGaragem==1 || sensorPresencaSala==1 || sensorPresencaCozinha==1 || sensorPresencaQuarto1==1 ||sensorPresencaQuarto2==1 || sensorPresencaQuarto3==1 || sensorPresencaBanheiro==1)){
				
				int res;
				mysql_init(&conexao);
				//conexao, servidor, usuario, senha, bd,0,NULL,0
				if(mysql_real_connect(&conexao, "db4free.net", "aut_resi", "automacao_resi", "automacao_resi", 3306, NULL, 0)){ 
					printf("Conectado com o banco\n");
				} else{
					printf("Falha ao conectar com o banco\n"); 
					printf("Erro %d:\t%s\n", mysql_errno(&conexao), mysql_error(&conexao));
				}
				//insere na tabela
				char string[300]= "insert into historico_alarme(ocorrencia, horario, data) values('Ha intrusos: ";
		
				if(sensorPortaAberta==1){
					strcat(string, "Porta Aberta");
				} else if(sensorJanelaAberta==1){
					strcat(string, "Janela Aberta");
				}
				
				strcat(string, "', '");
			
				time(&segundos); //Obtendo o tempo em segundos   
				data_hora_atual = localtime(&segundos); //Para converter de segundos para o tempo local utilizamos a função localtime  
				
				char hora[5], minutos[5], segundos[5];
				sprintf(hora, "%i", data_hora_atual->tm_hour);
				sprintf(minutos, "%i", data_hora_atual->tm_min);
				sprintf(segundos, "%i", data_hora_atual->tm_sec);
				
				//concatena hora no formato 00:00:00
				strcat(string, hora);
				strcat(string, ":");
				strcat(string, minutos);
				strcat(string, ":");
				strcat(string, segundos);
				strcat(string, "', '");
				
				//concatena mensagem para o assistente
				char assistente[100]="O alarme foi acionado as ";
				strcat(assistente, hora);
				strcat(assistente, " horas e ");
				strcat(assistente, minutos);
				strcat(assistente, " minutos. ");
				
				
				char ano[5], mes[5], dia[5];
				sprintf(dia, "%i", data_hora_atual->tm_mday);
				sprintf(mes, "%i", data_hora_atual->tm_mon+1);
				sprintf(ano, "%i", data_hora_atual->tm_year+1900);
				
				strcat(string, ano);
				strcat(string, "-");
				strcat(string, mes);
				strcat(string, "-");
				strcat(string, dia);
				strcat(string, "')");
				
				res = mysql_query(&conexao, string);//"insert into historico_alarme(ocorrencia, horario, data) values('Teste', '00:00:00', '9999-12-31')"
				publish(client, "AutomacaoResidencial/Alarme/Alerta", "Ha intrusos:1"); //publica o alerta
				publish(client, "AutomacaoResidencial/Assistente/Alarme/Alerta", assistente); //publica o alerta
				minutoOcorrencia = data_hora_atual->tm_min;
				diferenca=0;
				if(!res){
					//printf("Dados inseridos\n");
				} else{
					printf("Erro na inserção no banco de dados\n");
					printf("Erro %d:\t%s\n", mysql_errno(&conexao), mysql_error(&conexao));
				}
			} else{//se não tem presenca ta tudo seguro, 
				diferenca=10;
				publish(client, "AutomacaoResidencial/Assistente/Alarme", "Alarme ligado:1"); //publica para o alarme ficar verde
			}
		} else{//obtem a diferenca do tempo da ocorrencia e o atual para aguardar 10 minutos para verificar se ha outra ocorrencia
			time(&segundos); //Obtendo o tempo em segundos   
			data_hora_atual = localtime(&segundos); //Para converter de segundos para o tempo local utilizamos a função localtime  
			diferenca = minutoOcorrencia - data_hora_atual->tm_min;//obtem o tempo de diferenca
			
		}
		sleep(60);
	}
	pthread_exit(NULL); //finalização da thread
}

/*Funcao que controla o ambiente interno, verifica se esta dentro do horario cadastrado e aciona o dispositivo caso necessario*/
void *controlador_interno_ambiente(){//função a ser executada quando uma thread for criada

	struct tm *data_hora_atual; //Ponteiro para struct que armazena data e hora      
	time_t segundos; //Variável do tipo time_t para armazenar o tempo em segundos
	
	while(1){
		
		time(&segundos); //Obtendo o tempo em segundos   
		data_hora_atual = localtime(&segundos); //Para converter de segundos para o tempo local utilizamos a função localtime  
			
		//se estiver dentro do tempo cadastrado
		if((data_hora_atual->tm_hour >= horaINI && data_hora_atual->tm_min>= minutoINI) || (data_hora_atual->tm_hour <= horaFIM && data_hora_atual->tm_min <minutoFIM)){
		//if((data_hora_atual->tm_hour >= 10 && data_hora_atual->tm_min>= 38) && (data_hora_atual->tm_hour <= 10 && data_hora_atual->tm_min < 41)){
			estadoIluminacaoJardim=1;
			publish(client, "AutomacaoResidencial/Lampada/'Jardim'", "Luz acesa:1"); 
		} else if((data_hora_atual->tm_hour <= horaFIM && data_hora_atual->tm_min <minutoFIM)){
			estadoIluminacaoJardim=0;
			publish(client, "AutomacaoResidencial/Lampada/'Jardim'", "Luz apagada:0"); 
		}	
		//se estiver dentro do tempo cadastrado
		if((data_hora_atual->tm_hour >= horaINI && data_hora_atual->tm_min>= minutoINI) || (data_hora_atual->tm_hour <= horaFIM && data_hora_atual->tm_min < minutoFIM)){
			//verifica se ha presença 
			if(sensorPresencaGaragem){
				publish(client, "AutomacaoResidencial/Lampada/'Garagem'", "Luz acesa:1");
			} else{
				publish(client, "AutomacaoResidencial/Lampada/'Garagem'", "Luz apagada:0");
			}
			if(sensorPresencaSala){
				publish(client, "AutomacaoResidencial/Lampada/'Sala'", "Luz acesa:1"); 
			} else{
				publish(client, "AutomacaoResidencial/Lampada/'Sala'", "Luz apagada:0");
			}
			if(sensorPresencaCozinha){
				publish(client, "AutomacaoResidencial/Lampada/'Cozinha'", "Luz acesa:1"); 
			} else{
				publish(client, "AutomacaoResidencial/Lampada/'Cozinha'", "Luz apagada:0");
			}
			if(sensorPresencaQuarto1){
				publish(client, "AutomacaoResidencial/Lampada/'Quarto1'", "Luz acesa:1"); 
			} else{
				publish(client, "AutomacaoResidencial/Lampada/'Quarto1'", "Luz apagada:0");
			}
			if(sensorPresencaQuarto2){
				publish(client, "AutomacaoResidencial/Lampada/'Quarto2'", "Luz acesa:1"); 
			} else{
				publish(client, "AutomacaoResidencial/Lampada/'Quarto2'", "Luz apagada:0");
			}
			if(sensorPresencaQuarto3){
				publish(client, "AutomacaoResidencial/Lampada/'Quarto3'", "Luz acesa:1"); 
			} else{
				publish(client, "AutomacaoResidencial/Lampada/'Quarto3'", "Luz apagada:0");
			}
			if(sensorPresencaBanheiro){
				publish(client, "AutomacaoResidencial/Lampada/'Banheiro'", "Luz acesa:1"); 
			} else{
				publish(client, "AutomacaoResidencial/Lampada/'Banheiro'", "Luz apagada:0");
			}
		}
		sleep(10);
	}
	pthread_exit(NULL); //finalização da thread
}

/*Fucao que publica no topico de monitoramneto continuamente para que os clientes (assitente e web) saibam quando o dispositivo está conectado*/
void *monitoramento_continuo(){//função a ser executada quando a thread 2 for criada

	struct tm *data_hora_atual; //Ponteiro para struct que armazena data e hora      
	time_t segundos; //Variável do tipo time_t para armazenar o tempo em segundos
	
	while(1){
		time(&segundos); //Obtendo o tempo em segundos   
		data_hora_atual = localtime(&segundos); //Para converter de segundos para o tempo local utilizamos a função localtime  
			
		char hora[5], minutos[5], segundos[5];
		//obtem os char referente ao tempo
		sprintf(hora, "%i", data_hora_atual->tm_hour);
		sprintf(minutos, "%i", data_hora_atual->tm_min);
		sprintf(segundos, "%i", data_hora_atual->tm_sec);
			
		//concatena mensagem para o assistente
		char assistente[100]="O dispositivo foi desconectado as ";
		strcat(assistente, hora);
		strcat(assistente, " horas e ");
		strcat(assistente, minutos);
		strcat(assistente, " minutos. ");
		
		char msg[50] = "Dispositivo ligado:", temp[5];
		sprintf(temp, "%x", tempoNotificacao);//obtem o valor do tempo de notificacao em string
		strcat(msg,temp);//comcatena o tempo e a mensagem
		//publica mensagens
		publish(client, "AutomacaoResidencial/Monitoramento", msg);
		strcat(msg, "/");
		strcat(msg, assistente);
		publish(client, "AutomacaoResidencial/Assistente/Monitoramento", msg);
		sleep(1);	
	}
	pthread_exit(NULL); //finalização da thread
}


void atualiza(){
}

/*Funcao que armazena todas as acoes que ocorrem em uma arquivo de texto, um arquivo é gerado para cada dia*/
void salva_log(char *acao){
	char data[50]="LOGFILE_", dia[5], mes[5], ano[5]; // variável do tipo string
	char *filename;
  
	struct tm *data_hora_atual; //Ponteiro para struct que armazena data e hora      
	time_t segundos; //Variável do tipo time_t para armazenar o tempo em segundos
	time(&segundos); //Obtendo o tempo em segundos   
	data_hora_atual = localtime(&segundos); //Para converter de segundos para o tempo local utilizamos a função localtime  
	
	sprintf(dia, "%d", data_hora_atual->tm_mday);
	sprintf(mes, "%d", data_hora_atual->tm_mon+1);
	sprintf(ano, "%d", data_hora_atual->tm_year+1900);
  
	strcat(data, dia);
	strcat(data, mes);
	strcat(data, ano);
	strcat(data, ".txt");

	filename=data;
	//abrindo o arquivo com tipo de abertura w
	pont_arq = fopen(filename, "a");//ARLOG:9/11/2021.txt
  
	//testando se o arquivo foi realmente criado
	if(pont_arq == NULL){
		printf("\nErro na abertura do arquivo\n");
		return;
	}
  
	char conteudo[100]="Horario=", hora[2], min[2], seg[2];
	sprintf(hora, "%d", data_hora_atual->tm_hour);
	sprintf(min, "%d", data_hora_atual->tm_min);
	sprintf(seg, "%d", data_hora_atual->tm_sec);
	
	//concatena o horário
	strcat(conteudo, hora);
	strcat(conteudo, ":");
	strcat(conteudo, min);
	strcat(conteudo, ":");
	strcat(conteudo, seg);
	//concatena a ação
	strcat(conteudo, ";Acao=");
	strcat(conteudo, acao);
	strcat(conteudo, "\n");
	  
	//usando fprintf para armazenar a string no arquivo
	fprintf(pont_arq, "%s", conteudo);

	//fclose fecha o arquivo
	fclose(pont_arq);
	printf("Dados gravados!");
}

/*Funcao que publica a mensagem no topico, onde ambos são enviado como parametro*/
void publish(MQTTClient client, char* topic, char* payload) {
    MQTTClient_message pubmsg = MQTTClient_message_initializer;
    pubmsg.payload = payload;
    pubmsg.payloadlen = strlen(pubmsg.payload);
    pubmsg.qos = 0;
    pubmsg.retained = 0;
    MQTTClient_deliveryToken token;
    MQTTClient_publishMessage(client, topic, &pubmsg, &token);
    MQTTClient_waitForCompletion(client, token, 1000L);
	MQTTClient_free(topic);

	//verifica quando será necessario exibir a mesnagem que foi enviado, apenas para não encher a tela 
    if( (strcmp(topic, "AutomacaoResidencial/Monitoramento")!=0) && (strcmp(topic, "AutomacaoResidencial/Assistente/Monitoramento")!=0) && (strcmp(topic, "AutomacaoResidencial/Atualiza")!=0)) {
    	printf("\tEnviado: '%s'\n", payload);
    	printf("\n____________________________________________________________________________\n");
	}
}

/*Funcao que e chamada quando a conexao é predida*/
void connlost(void *context, char *cause){
    printf("\n\tConexão perdida!");
    printf("Causa: %s\n", cause);
}
 
/*Funcao que é chamda quando chega uma mensagem. Esta funcao verifica o tópico em que a mensagem foi recebida e faz as devidas operaçoes referente a cada uma */
int on_message(void *context, char *topicName, int topicLen, MQTTClient_message *message) {
    char* payload = message->payload;
    char acao[50]="";
    //printf("\n\tTopico: %s\n", topicName);
	//printf("\tMensagem: %s\n", payload);

	char* iluminacao = "ILUMINACAO";
	char* arcondicionado = "AR";
	char* alarme = "ALARME";
	char* sensor = "SENSOR";
	char* assistente = "ASSISTENTE";
	
	//se as mensagens forem as especificadas, a operação é referente a alteracao no estado do dispositivo
	if( (strcmp(payload, iluminacao)==0) || (strcmp(payload, arcondicionado)==0) || (strcmp(payload, alarme)==0) || (strcmp(payload, sensor)==0) || (strcmp(payload, assistente)==0)){
    	
		printf("\n\tTopico: %s\n", topicName);
		printf("\tMensagem: %s\n", payload);
		
    	char delim[] = "/";
		char* ptr = strtok(topicName, delim);// split("/")
		char* comodo;
		
		while(ptr != NULL){//percorre o ponteiro da topico até o fim
			if(strcmp(ptr, "Lampada")==0){
				ptr = strtok(NULL, delim);
				comodo = ptr;
				//se o comodo indicado no topico for 'Jardim'
				if (strcmp(comodo, "'Jardim'") == 0){//altera o estado da lampada e publica o estado atual
					if( estadoIluminacaoJardim==0){//se estiver desligado 
						estadoIluminacaoJardim=1;//muda estado da variavel para 1 (ligado)
						publish(client, "AutomacaoResidencial/Lampada/'Jardim'", "Luz acesa:1"); //publica para a web
						strcat(acao, "Ligou iluminação do jardim");//concatena a acao executada para ser salva no arquivo
						//se a solicitacao veio do assn=isitente
						if((strcmp(payload, assistente)==0)){
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Jardim'", "Luz acesa:1"); //publica no topico para o assistente	
						}
					} else{//se estiver ligado 
						estadoIluminacaoJardim=0;//altera o estadoo para desligado
						publish(client, "AutomacaoResidencial/Lampada/'Jardim'", "Luz apagada:0"); //publica no tópico para a web 
						strcat(acao, "Desligou iluminação do jardim");//concatena acao 
						if((strcmp(payload, assistente)==0)){//verifica se foi o assistente que solicitou
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Jardim'", "Luz apagada:0"); 	//publica para o assistente
						}
					}
				}
				//verifica se o comodo é a garagem e realiza as operacoes
				else if (strcmp(comodo, "'Garagem'") == 0){
					if( estadoIluminacaoGaragem==0){
						estadoIluminacaoGaragem=1;
						sensorPresencaGaragem=1;
						publish(client, "AutomacaoResidencial/Lampada/'Garagem'", "Luz acesa:1"); 
						strcat(acao, "Acendeu a luz da Garagem");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Garagem'", "Luz acesa:1"); 
						}
					} else{
						estadoIluminacaoGaragem=0;
						sensorPresencaGaragem=0;
						publish(client, "AutomacaoResidencial/Lampada/'Garagem'", "Luz apagada:0"); 
						strcat(acao, "Apagou a luz da Garagem");
						if((strcmp(payload, assistente)==0)){
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Garagem'", "Luz apagada:0"); 	
						}
					}
				}
				//verifica se o comodo é a sala e realiza as operacoes
				else if (strcmp(comodo, "'Sala'") == 0){
					if( estadoIluminacaoSala==0){
						estadoIluminacaoSala=1;
						sensorPresencaSala=1;
						publish(client, "AutomacaoResidencial/Lampada/'Sala'", "Luz acesa:1");
						strcat(acao, "Acendeu a luz da Sala"); 
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Sala'", "Luz acesa:1"); 
						}
					} else{
						estadoIluminacaoSala=0;
						sensorPresencaSala=0;
						publish(client, "AutomacaoResidencial/Lampada/'Sala'", "Luz apagada:0");
						strcat(acao, "Apagou a luz da Sala"); 
						if((strcmp(payload, assistente)==0)){
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Sala'", "Luz apagada:0"); 	
						}
					}
				}
				//verifica se o comodo é a cozinha e realiza as operacoes
				else if (strcmp(comodo, "'Cozinha'") == 0){
					if( estadoIluminacaoCozinha==0){
						estadoIluminacaoCozinha=1;
						sensorPresencaCozinha=1;
						publish(client, "AutomacaoResidencial/Lampada/'Cozinha'", "Luz acesa:1");
						strcat(acao, "Acendeu a luz da Cozinha");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Cozinha'", "Luz acesa:1"); 
						}
					} else{
						estadoIluminacaoCozinha=0;
						sensorPresencaCozinha=0;
						publish(client, "AutomacaoResidencial/Lampada/'Cozinha'", "Luz apagada:0"); 
						strcat(acao, "Apagou a luz da Cozinha");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Cozinha'", "Luz apagada:0"); 
							strcat(acao, "Apagou a luz da Cozinha");
						}
					}
				}
				//verifica se o comodo é o quarto 1 e realiza as operacoes
				else if (strcmp(comodo, "'Quarto1'") == 0){
					if( estadoIluminacaoQuarto1==0){
						estadoIluminacaoQuarto1=1;
						sensorPresencaQuarto1=1;
						publish(client, "AutomacaoResidencial/Lampada/'Quarto1'", "Luz acesa:1"); 
						strcat(acao, "Acendeu a luz do Quarto 1");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Quarto1'", "Luz acesa:1"); 
						}
					} else{
						estadoIluminacaoQuarto1=0;
						sensorPresencaQuarto1=0;
						publish(client, "AutomacaoResidencial/Lampada/'Quarto1'", "Luz apagada:0");
						strcat(acao, "Apagou a luz do Quarto 1");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Quarto1'", "Luz apagada:0");
						} 
					}
				}
				//verifica se o comodo é quarto 2 e realiza as operacoes
				else if(strcmp(comodo, "'Quarto2'") == 0){
					if( estadoIluminacaoQuarto2==0){
						estadoIluminacaoQuarto2=1;
						sensorPresencaQuarto2=1;
						publish(client, "AutomacaoResidencial/Lampada/'Quarto2'", "Luz acesa:1");
						strcat(acao, "Acendeu a luz do Quarto 2");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Quarto2'", "Luz acesa:1");
						}
					} else{
						estadoIluminacaoQuarto2=0;
						sensorPresencaQuarto2=0;
						publish(client, "AutomacaoResidencial/Lampada/'Quarto2'", "Luz apagada:0"); 
						strcat(acao, "Apagou a luz do Quarto 2");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Quarto2'", "Luz apagada:0"); 
						}
					}
				}
				//verifica se o comodo é o quarto 3 e realiza as operacoes
				else if(strcmp(comodo, "'Quarto3'") == 0){
					if( estadoIluminacaoQuarto3==0){
						estadoIluminacaoQuarto3=1;
						sensorPresencaQuarto3=1;
						publish(client, "AutomacaoResidencial/Lampada/'Quarto3'", "Luz acesa:1");
						strcat(acao, "Acendeu a luz do Quarto 3"); 
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Quarto3'", "Luz acesa:1"); 
						}
					} else{
						estadoIluminacaoQuarto3=0;
						sensorPresencaQuarto3=0;
						publish(client, "AutomacaoResidencial/Lampada/'Quarto3'", "Luz apagada:0");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Quarto3'", "Luz apagada:0");
							strcat(acao, "Apagou a luz do Quarto 3");
						} 
					}
					
				}
				//verifica se o comodo é o banheiro e realiza as operacoes
				else if(strcmp(comodo, "'Banheiro'") == 0){
					if( estadoIluminacaoBanheiro==0){
						estadoIluminacaoBanheiro=1;
						sensorPresencaBanheiro=1;
						publish(client, "AutomacaoResidencial/Lampada/'Banheiro'", "Luz acesa:1"); 
						strcat(acao, "Acendeu a luz do Banheiro");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Banheiro'", "Luz acesa:1"); 
						}
					} else{
						estadoIluminacaoBanheiro=0;
						sensorPresencaBanheiro=0;
						publish(client, "AutomacaoResidencial/Lampada/'Banheiro'", "Luz apagada:0"); 
						strcat(acao, "Apagou a luz do Banheiro");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/Lampada/'Banheiro'", "Luz apagada:0"); 
						}
					}
				}
			//verifica se o tópico é do sensor, se for altera o estados dos sesore de 0 para 1 ou o contrário
			} if(strcmp(ptr, "Sensor")==0){
				ptr = strtok(NULL, delim);
				comodo = ptr;
				//verifica se o comodo é a garagem
				if (strcmp(comodo, "'Garagem'") == 0){
					//alterna o estado da variavel do sensor
					if( sensorPresencaGaragem==0){
						sensorPresencaGaragem=1;
					} else{
						sensorPresencaGaragem=0;
					}
				}
				//verifica se o comodo é a sala
				else if (strcmp(comodo, "'Sala'") == 0){
					//alterna o estado da variavel do sensor
					if( sensorPresencaSala==0){
						sensorPresencaSala=1;
					} else{
						sensorPresencaSala=0;
					}
				}
				//verifica se o comodo é a cozinha
				else if (strcmp(comodo, "'Cozinha'") == 0){
					//alterna o estado da variavel do sensor
					if( sensorPresencaCozinha==0){
						sensorPresencaCozinha=1;
					} else{
						sensorPresencaCozinha=0;
					}
				}
				//verifica se o comodo é a quarto 1
				else if (strcmp(comodo, "'Quarto1'") == 0){
					//alterna o estado da variavel do sensor
					if( sensorPresencaQuarto1==0){
						sensorPresencaQuarto1=1;
					} else{
						sensorPresencaQuarto1=0;
					}
				}
				//verifica se o comodo é a quarto 2
				else if(strcmp(comodo, "'Quarto2'") == 0){
					//alterna o estado da variavel do sensor
					if( sensorPresencaQuarto2==0){
						sensorPresencaQuarto2=1;
					} else{
						sensorPresencaQuarto2=0;
	
					}
				}
				//verifica se o comodo é a quarto 3
				else if(strcmp(comodo, "'Quarto3'") == 0){
					//alterna o estado da variavel do sensor
					if( sensorPresencaQuarto3==0){
						sensorPresencaQuarto3=1;
					} else{
						sensorPresencaQuarto3=0;
					}
				}
				//verifica se o comodo é o banheiro
				else if(strcmp(comodo, "'Banheiro'") == 0){
					//alterna o estado da variavel do sensor
					if( sensorPresencaBanheiro==0){
						sensorPresencaBanheiro=1;
					} else{
						sensorPresencaBanheiro=0;
					}
				}
				//verifica se é o sensor da porta
				else if(strcmp(comodo, "'Porta'") == 0){
					//alterna o estado da variavel do sensor
					if( sensorPortaAberta==0){
						sensorPortaAberta=1;
					} else{
						sensorPortaAberta=0;
					}
				}
					//verifica se é o sensor da janela
				else if(strcmp(comodo, "'Janela'") == 0){
					//alterna o estado da variavel do sensor
					if( sensorJanelaAberta==0){
						sensorJanelaAberta=1;
					} else{
						sensorJanelaAberta=0;
					}
				}
				
			//verifica se o topico é referente ao ar-condicionado
			} else if(strcmp(ptr, "ArCondicionado")==0){
				ptr = strtok(NULL, delim);
				comodo = ptr;

				char* quarto1 = "'Quarto1'\0";
				char* sala = "'Sala'\0";
				
				//verifica se o comodo é o quarto 1
				if(strcmp(comodo, quarto1)==0){
					//verifica o estado atual e alterna, se for 0, muda para 1
					if( estadoArCondicionadoQuarto1==0){
						estadoArCondicionadoQuarto1=1;
						publish(client, "AutomacaoResidencial/ArCondicionado/'Quarto1'", "Ar-condicionado ligado:1"); //publica para a web
						strcat(acao, "Ligou ar-condicionado do Quarto 1");
						//verifica se o assistente solicitou 
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/ArCondicionado/'Quarto1'", "Ar-condicionado ligado:1"); //publica para o assistente
						}
					} else{//se for 1 muda para 0
						estadoArCondicionadoQuarto1=0;
						publish(client, "AutomacaoResidencial/ArCondicionado/'Quarto1'", "Ar-condicionado desligado:0");
						strcat(acao, "Desligou ar-condicionado do Quarto 1");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/ArCondicionado/'Quarto1'", "Ar-condicionado desligado:0"); 
						} 
					}
					
				}
				//verificar se o commodo é a sala e realiza as operaçoes
				else if(strcmp(comodo, sala) == 0){
					if( estadoArCondicionadoSala==0){
						estadoArCondicionadoSala=1;
						publish(client, "AutomacaoResidencial/ArCondicionado/'Sala'", "Ar-condicionado ligado:1"); 
						strcat(acao, "Ligou ar-condicionado da Sala");
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/ArCondicionado/'Sala'", "Ar-condicionado ligado:1"); 
						}
					} else{
						estadoArCondicionadoSala=0;
						publish(client, "AutomacaoResidencial/ArCondicionado/'Sala'", "Ar-condicionado desligado:0");
						strcat(acao, "Desligou ar-condicionado da Sala"); 
						if((strcmp(payload, assistente)==0)){	
							publish(client, "AutomacaoResidencial/Assistente/ArCondicionado/'Sala'", "Ar-condicionado desligado:0"); 
						} 
					}
				}
				
			//verifica se o topico é referente ao alarme
			} else if(strcmp(ptr, "Alarme")==0){
				if( estadoAlarme==1){//verifica o estado, se for 1 (ligado)
					estadoAlarme=0;//muda para 0 (desligado)
					publish(client, "AutomacaoResidencial/Alarme", "Alarme desligado:0");//publica para web
					strcat(acao, "Desativou o Alarme"); //concatena string para arquivo de texto
					//verifica se o assitente solicitou
					if((strcmp(payload, assistente)==0)){	
						publish(client, "AutomacaoResidencial/Assistente/Alarme", "Alarme desligado:0");  //publica para o assistente
					} 
				} else{//se o estado for 0, muda para 1 e realiza as operações
					estadoAlarme=1;
					publish(client, "AutomacaoResidencial/Alarme", "Alarme ligado:1"); 
					strcat(acao, "Ativou o Alarme");
					if((strcmp(payload, assistente)==0)){	
						publish(client, "AutomacaoResidencial/Assistente/Alarme", "Alarme ligado:1");  
					} 
				}
				
			}
			ptr = strtok(NULL, delim);//vai para o proximo item 
		}
		salva_log(acao);//salva no arquivo de texto
		
	} else{//se nao for as mensagens especificadas a operacao é de configuracao
		char delim[] = "/";
		char delim2[] = ":";
		if(strcmp(topicName, "AutomacaoResidencial/Configuracao/AmbienteInterno")==0){//se for configuracao de ambiente interno
			
			printf("\n\tTopico: %s\n", topicName);
			printf("\tMensagem: %s\n", payload);
			
			char *tempoInicial = strtok(payload, delim);//split("/") separa mensagem nas /
			char *tempoFinal = strtok(NULL, delim);
			
			char *horaTempoInicial = strtok(tempoInicial, delim2);//split(":") separa mensagem nos :
			char *minutoTempoInicial = strtok(NULL, delim2);
			
			//obtem a hora e minuto inicial e converte em int
			horaINI= atoi(horaTempoInicial);
			minutoINI= atoi(minutoTempoInicial);
			
			char *horaTempoFinal = strtok(tempoFinal, delim2);//split(":") separa mensagem nos :
			char *minutoTempoFinal = strtok(NULL, delim2);
			
			//obtem a hora e minuto final e converte em int
			horaFIM = atoi(horaTempoFinal);
			minutoFIM = atoi(minutoTempoFinal);
			strcat(acao, "Configurou ambiente interno");//concatena string para o log
			salva_log(acao);
			
		} else if(strcmp(topicName, "AutomacaoResidencial/Configuracao/ArCondicionado")==0){// se o topico for referente a configuracao do ar-condicionado
			
			printf("\n\tTopico: %s\n", topicName);
			printf("\tMensagem: %s\n", payload);
			
			char *tempMAX = strtok(payload, delim);//separa a mensagem em /
			char *tempMIN = strtok(NULL, delim);
			char *espera = strtok(NULL, delim);
			
			temperaturaMAX= atoi(tempMAX);//obtem o valor em int
			temperaturaMIN= atoi(tempMIN);
			tempoEspera= atoi(espera);
			strcat(acao, "Configurou ar-condicionado");//concatena mensagem
			salva_log(acao);//salva arquivo
			
		} else if(strcmp(topicName, "AutomacaoResidencial/Configuracao/Notificacao")==0){//se o tópico for referente a configuracao da notificacao
			
			printf("\n\tTopico: %s\n", topicName);
			printf("\tMensagem: %s\n", payload);
			
			char *tempoNotif = payload;
			tempoNotificacao = atoi(tempoNotif);//guarda o tempo em int
			strcat(acao, "Configurou tempo de notificacao");//concaten a operacao que foi realizada
			salva_log(acao);//salva no arquivo
			
		} else if(strcmp(topicName, "AutomacaoResidencial/Atualizacao")==0 ){//atualiza site toda vez que é conectado
		
			printf("\n\tTopico: %s\n", topicName);
			printf("\tMensagem: %s\n", payload);
			
			char delim[] = "/";
			char alarme[5], arSala[5], arQuarto1[5], luzJardim[5], luzGaragem[5], luzSala[5], luzCozinha[5], luzQuarto1[5], luzQuarto2[5], luzQuarto3[5], luzBanheiro[5];
			
			//transforma o estado dos dispositivo em char para poder concatenar 
			sprintf(alarme, "%x", estadoAlarme);
			sprintf(arSala, "%x", estadoArCondicionadoSala);
			sprintf(arQuarto1, "%x", estadoArCondicionadoQuarto1);
			sprintf(luzJardim, "%x", estadoIluminacaoJardim);
			sprintf(luzGaragem, "%x", estadoIluminacaoGaragem);
			sprintf(luzSala, "%x", estadoIluminacaoSala);
			sprintf(luzCozinha, "%x", estadoIluminacaoCozinha);
			sprintf(luzQuarto1, "%x", estadoIluminacaoQuarto1);
			sprintf(luzQuarto2, "%x", estadoIluminacaoQuarto2);
			sprintf(luzQuarto3, "%x", estadoIluminacaoQuarto3);
			sprintf(luzBanheiro, "%x", estadoIluminacaoBanheiro);
					
			char atualizacao[50]="Atualizacao:";

			//concatena o estado e uma / alternadamente eter obter todos os dispositivos
			strcat(atualizacao,alarme);
			strcat(atualizacao,delim);
			strcat(atualizacao,arSala);
			strcat(atualizacao,delim);
			strcat(atualizacao,arQuarto1);
			strcat(atualizacao,delim);
			strcat(atualizacao,luzJardim);
			strcat(atualizacao,delim);
			strcat(atualizacao,luzGaragem);
			strcat(atualizacao,delim);
			strcat(atualizacao,luzSala);
			strcat(atualizacao,delim);
			strcat(atualizacao,luzCozinha);
			strcat(atualizacao,delim);
			strcat(atualizacao,luzQuarto1);
			strcat(atualizacao,delim);
			strcat(atualizacao,luzQuarto2);
			strcat(atualizacao,delim);
			strcat(atualizacao,luzQuarto3);
			strcat(atualizacao,delim);
			strcat(atualizacao,luzBanheiro);
			printf(atualizacao);
			publish(client, "AutomacaoResidencial/Assistente/Atualizacao", atualizacao); //publica atualizacao no assistente
			publish(client, "AutomacaoResidencial/Atualiza", atualizacao); //publica na web
		}
		
		
	}
    MQTTClient_freeMessage(&message);
    MQTTClient_free(topicName);
    return 1;
}



int main(){
	
    MQTTClient_create(&client, "broker.mqttdashboard.com", CLIENTID, MQTTCLIENT_PERSISTENCE_NONE, NULL);
    MQTTClient_connectOptions conn_opts = MQTTClient_connectOptions_initializer;	
	MQTTClient_setCallbacks(client, NULL, connlost, on_message, NULL);
	int rc, num=1;
	   
	printf("\n____________________________________________________________________________\n\n");
	printf("\t AUTOMACAO RESIDENCIAL - Sistema de Monitoramento Continuo \t");
	printf("\n____________________________________________________________________________\n");
	  
	rc = MQTTClient_connect(client, &conn_opts);
    if ( rc != MQTTCLIENT_SUCCESS) {
        printf("Falha ao conectar: %d\n", rc);
        exit(-1);
    }
    MQTTClient_subscribe(client, "AutomacaoResidencial/#", 0);//Inscreve no tópico principal
    
    //cria as thred que executarao o funcoe de controlado interno do alarme e amibiente, e do monitoramento continuo
	pthread_t thread1, thread2, thread3;
    pthread_create(&thread1, NULL, controlador_interno_alarme, (void *)num); //criando thread 1
    pthread_create(&thread2, NULL, controlador_interno_ambiente, (void *)num); //criando thread 2
    pthread_create(&thread3, NULL, monitoramento_continuo, (void *)num); //criando thread 3
    
	while(1){
    }
    
    MQTTClient_disconnect(client, 1000);
    MQTTClient_destroy(&client);
    return rc;
  	return 0;
}





