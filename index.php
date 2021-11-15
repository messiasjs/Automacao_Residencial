
<!DOCTYPE html
	PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">



<head>
    <title>Automação Residencial</title>
    <meta charset="utf-8" name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css" type="text/css">
    <!--Importa a biblioteca PAHO -->
    <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.2/mqttws31.min.js" type="text/javascript"></script>-->
    <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.js" type="text/javascript"></script>-->
    <script src="mqttws31.js" type="text/javascript"></script><!---->
    <script src="mqtt.js" type="text/javascript"></script>
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
   <link rel="stylesheet" href="font-awesome.min.css">
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
   
   <!--<link href="grid/simple-grid.min.css" rel="stylesheet">  -->
</head>

<body onload="MQTTconnect()">


    <h4>AUTOMAÇÃO RESIDENCIAL</h4>
    <!---<i id="coneccao" class="fa fa-wifi" style="font-size:36px;color:yellow"></i><br>-->
    
    <div style="width:55%; float:left">
        <h3 class="section">Gerenciador de Ambientes</h3>
        <table class="container">
            <thead>
            <tr class="blue">
                <th><h1>CÔMODO</h1></th>
                <th><h1>ILUMINAÇÃO</h1></th>
                <th><h1>AR-CONDICIONADO</h1></th>
            </tr>
            </thead>
            <tbody class="item">
            <tr>
                <td>Jardim</td>
                <td><a onclick="change_lamp_state('\'Jardim\'')"><i id="jardim" class="fa fa-lightbulb-o" style="font-size:36px;color: white"></i></a></td>
                <td><i class="fa fa-snowflake-o" style="font-size:36px;color:grey"></i></td>
            </tr>
            <tr>
                <td>Garagem</td>
                <td><a onclick="change_lamp_state('\'Garagem\'')"><i id="garagem" class="fa fa-lightbulb-o" style="font-size:36px;color:white"></i></a></td>                
                <td><i class="fa fa-snowflake-o" style="font-size:36px;color:grey"></i></td>
            </tr>
            <tr>
                <td>Sala</td>
                <td><a onclick="change_lamp_state('\'Sala\'')"><i id="sala" class="fa fa-lightbulb-o" style="font-size:36px;color:white"></i></a></td>                
                <td><i onclick="change_airc_state('\'Sala\'')" id="salaAr" class="fa fa-snowflake-o" style="font-size:36px;color:white"></i></td>
            </tr>
            <tr>
                <td>Cozinha</td>
                <td><a onclick="change_lamp_state('\'Cozinha\'')"><i id="cozinha" class="fa fa-lightbulb-o" style="font-size:36px;color:white"></i></a></td>                
                <td><i class="fa fa-snowflake-o" style="font-size:36px;color:grey"></i></td>
            </tr>
            <tr>
                <td>Quarto 1</td>
                <td><a onclick="change_lamp_state('\'Quarto1\'')"><i id="quarto1" class="fa fa-lightbulb-o" style="font-size:36px;color:white"></i></a></td>                
                <td><i onclick="change_airc_state('\'Quarto1\'')" id="quarto1Ar" class="fa fa-snowflake-o" style="font-size:36px;color:white"></i></td>
            </tr>
            <tr>
                <td>Quarto 2</td>
                <td><a onclick="change_lamp_state('\'Quarto2\'')"><i id="quarto2" class="fa fa-lightbulb-o" style="font-size:36px;color:white"></i></a></td>                
                <td><i class="fa fa-snowflake-o" style="font-size:36px;color:grey"></i></td>
            </tr>
            <tr>
                <td>Quarto 3</td>
                <td><a onclick="change_lamp_state('\'Quarto3\'')"><i id="quarto3" class="fa fa-lightbulb-o" style="font-size:36px;color:white"></i></a></td>                
                <td><i class="fa fa-snowflake-o" style="font-size:36px;color:grey"></i></td>
            </tr>
            <tr>
                <td>Banheiro</td>
                <td><a onclick="change_lamp_state('\'Banheiro\'')"><i id="banheiro" class="fa fa-lightbulb-o" style="font-size:36px;color:white"></i></a></td>                
                <td><i class="fa fa-snowflake-o" style="font-size:36px;color:grey"></i></td>
            </tr>
            </tbody>
        </table>
    </div>

    <div class="central" style="width: 45%; float:right">
        <h3 class="section">Central de Alarme</h3>
        <table class="container">
            <thead>
                <tr class="blue">
                    <th><h1></h1></th>
                    <th><h1>ESTADO</h1></th>
                    <th><h1>HISTÓRICO</h1></th>
                </tr>
            </thead>
            <tbody class="item">
                <tr>
                    <td>Alarme</td>
                    <td><i onclick="change_alarm_state('\'Alarme\'')" id="alarme" class="fa fa-clock-o" style="font-size:36px;color:white"></i></td>
                    <td><a href="automacao_historico.php">Ver histórico</a></td>
                </tr>
            </tbody>
        </table>


        <h3 class="section">Configurações</h3>
        
        <div class="config">
            <table>
                <h2>Iluminação ambientes internos</h2>
                <tr>
                    <td>Horário Inicial:</td>
                    <td><input id="AIinicio" type="time" value=""></td>
                </tr>
                <tr>
                    <td>Horário Final:</td>
                    <td><input id="AIfinal" type="time" value=""></td>
                </tr>
                
            </table>
            <button style="margin-bottom: 10px;" onclick="send_internal_configuration()" id="botao">Salvar</button>

            <table>
                <h2>Faixa de operação do ar-condicionado</h2>
                <tr>
                    <td>Temparetura máxima:</td>
                    <td><input id="ArMaximo" type="number" value=""></td>
                </tr>
                <tr>
                    <td>Temperatura mínima:</td>
                    <td><input id="ArMinimo" type="number" value=""></td>
                </tr>
                <tr>
                    <td>Tempo de espera (min):</td>
                    <td><input id="TempoEspera" type="number" value=""></td>
                </tr>
            </table>
            <button style="margin-bottom: 10px;" onclick="send_airc_configuration()" id="botao">Salvar</button>
        </div>



        
    </div>
    <div class=container>
        <h2 class="legenda">Legenda:
            &emsp;<i class="fa fa-circle" style="font-size:20px;color:gray" aria-hidden="False"> </i> Dispositvo não existe
            &emsp;&emsp;<i class="fa fa-circle" style="font-size:20px;color:white" aria-hidden="False"> </i> Dispositivo desligado
            &emsp;&emsp;<i class="fa fa-circle" style="font-size:20px;color:yellow" aria-hidden="False"> </i> Lâmpada ligada
            &emsp;&emsp;<i class="fa fa-circle" style="font-size:20px;color:#4DC3FA" aria-hidden="False"> </i> Ar-condicionado ligado
            &emsp;&emsp;<i class="fa fa-circle" style="font-size:20px;color:rgb(1, 223, 1)" aria-hidden="False"></i> Alarme ligado
            &emsp;&emsp;<i class="fa fa-circle" style="font-size:20px;color:red" aria-hidden="False"></i> Há intrusos
            
        </h2>
        <h2>by <a>Integrated IP LLC</a></h2>
    </div>

    <h3 class="section">Área de testes</h3>
        <table class="container">
            <thead>
            <tr class="blue">
                <th><h1>CÔMODO</h1></th>
                <th><h1>ESTADO</h1></th>
            </tr>
            </thead>
            <tbody class="item">
            <tr>
                <td>Garagem</td>
                <td><a onclick="change_sensor_state('\'Garagem\'')"><i id="'Garagem'" class="fa fa-wifi" style="font-size:36px;color:white"></i></a></td>                
        
            </tr>
            <tr>
                <td>Sala</td>
                <td><a onclick="change_sensor_state('\'Sala\'')"><i id="'Sala'" class="fa fa-wifi" style="font-size:36px;color:white"></i></a></td>                
                
            </tr>
            <tr>
                <td>Cozinha</td>
                <td><a onclick="change_sensor_state('\'Cozinha\'')"><i id="'Cozinha'" class="fa fa-wifi" style="font-size:36px;color:white"></i></a></td>                
    
            </tr>
            <tr>
                <td>Quarto 1</td>
                <td><a onclick="change_sensor_state('\'Quarto1\'')"><i id="'Quarto1'" class="fa fa-wifi" style="font-size:36px;color:white"></i></a></td>                
                
            </tr>
            <tr>
                <td>Quarto 2</td>
                <td><a onclick="change_sensor_state('\'Quarto2\'')"><i id="'Quarto2'" class="fa fa-wifi" style="font-size:36px;color:white"></i></a></td>                
            </tr>
            <tr>
                <td>Quarto 3</td>
                <td><a onclick="change_sensor_state('\'Quarto3\'')"><i id="'Quarto3'" class="fa fa-wifi" style="font-size:36px;color:white"></i></a></td>                
            </tr>
            <tr>
                <td>Banheiro</td>
                <td><a onclick="change_sensor_state('\'Banheiro\'')"><i id="'Banheiro'" class="fa fa-wifi" style="font-size:36px;color:white"></i></a></td>                
            </tr>
            <tr>
                <td>Porta</td>
                <td><a onclick="change_sensor_state('\'Porta\'')"><i id="'Porta'" class="fa fa-wifi" style="font-size:36px;color:white"></i></a></td>                
            </tr>
            <tr>
                <td>Janela</td>
                <td><a onclick="change_sensor_state('\'Janela\'')"><i id="'Janela'" class="fa fa-wifi" style="font-size:36px;color:white"></i></a></td>                
            </tr>
            </tbody>
        </table>

</body>

</html>