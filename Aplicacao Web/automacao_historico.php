<?php
$username ="aut_resi";
$password = "automacao_resi";
try {
    echo "Trying";
    $conn = new PDO('mysql:host=db4free.net;dbname=automacao_resi', $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch(PDOException $e) {
    echo '-------ERROR: ' . $e->getMessage();
}
?>
<!DOCTYPE html
	PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">



<style>

    body {
    /*font-family: 'Open s', sans-serif;*/
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-weight: 300;
    line-height: 1.42em;
    color:#ffffff;
    background-color:#1F2739;
    }

    h4 {
    font-size:3em; 
    font-weight: 300;
    line-height:1.2em;
    text-align: center;
    padding-left: 50px;
    padding-right: 50px;
    /*color: #FFF842;*/
    color: #4DC3FA;
    }

    h1 {
    font-size:3em; 
    font-weight: 300;
    line-height:1.2em;
    text-align: center;
    /*color: #FFF842;*/
    color: #4DC3FA;
    }

    h2 {
    font-size:1em; 
    font-weight: 300;
    text-align: center;
    display: block;
    line-height:1em;
    padding-bottom: 2em;
    color: #ffffff;
    }

    h2 a {
    font-weight: 700;
    /*text-transform: uppercase;*/
    color: #ffffff;
    text-decoration: none;
    }

    h3 {
    font-size: 2em; 
    font-weight: 30;
    text-align: center;
    line-height:1em;
    color: #ffffff;
    }

    .legenda{
        text-align: left;
        font-size: 14px; 
        line-height:30px;
    }

    .blue { color: #185875; }
    .yellow { color: #FFF842; }

    .container th h1 {
        font-weight: bold;
        font-size: 1em;
    text-align: center;
    /*color: #FFF842;*/
    color: #4DC3FA;
    }

    .item td{ 
        text-align: center;
    }

    .item td a:active{
        color: #ffffff;
        text-decoration: none;
    }

    .item td a:hover{
        color: #4DC3FA;
        text-decoration: none;
    }

    .item td a:active, a:link, a:visited {
	    text-decoration: none;
	}

    .container td {
        font-weight: normal;
        font-size: 1em;
    -webkit-box-shadow: 0 2px 2px -2px #0E1119;
        -moz-box-shadow: 0 2px 2px -2px #0E1119;
            box-shadow: 0 2px 2px -2px #0E1119;
    }

    .container {
        text-align: left;
        overflow: hidden;
        width: 50%;
        margin: 0 auto;
    display: table;
    padding: 0 0 2em 0;
    }

    .container td, .container th {
        padding-bottom: 2%;
        padding-top: 2%;
    padding-left:2%;  
    }

    /* Background-color of the odd rows */
    .container tr:nth-child(odd) {
        background-color: #323C50;
    }

    /* Background-color of the even rows */
    .container tr:nth-child(even) {
        background-color: #2C3446;
    }

    .container th {
        background-color: #1F2739;
    }

    .container td:first-child { 
        color: #ffffff; 
    }

    .container tr:hover {
    background-color: #3c4e74;
    -webkit-box-shadow: 0 6px 6px -6px #0E1119;
        -moz-box-shadow: 0 6px 6px -6px #0E1119;
            box-shadow: 0 6px 6px -6px #0E1119;
    }

    /*.container td:hover {
    background-color: #FFF842;
    color: #000000;
    font-weight: bold;
    
    box-shadow: #7F7C21 -1px 1px, #7F7C21 -2px 2px, #7F7C21 -3px 3px, #7F7C21 -4px 4px, #7F7C21 -5px 5px, #7F7C21 -6px 6px;
    /*transform: translate3d(6px, -6px, 0);*/
    
    /*transition-delay: 0s;
        transition-duration: 0.4s;
        transition-property: all;
    transition-timing-function: line;
    }*/

    @media (max-width: 800px) {
    .container td:nth-child(4),
    .container th:nth-child(4) { display: none; }
    }


</style>

<head>
<title>Automa????o Residencial</title>
    <meta charset="utf-8" name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css" type="text/css">
    <!--Importa a biblioteca PAHO -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.2/mqttws31.min.js" type="text/javascript"></script><!---->
    <!--<script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.js" type="text/javascript"></script>-->
    <!--<script src="mqttws231.js" type="text/javascript"></script>-->
    <script src="mqtt.js" type="text/javascript"></script>
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
   <link rel="stylesheet" href="font-awesome.min.css">
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>

<body>



    <h4>AUTOMA????O RESIDENCIAL</h4>
   
    <div>
        <h3 class="section">Hist??rico</h3>
        <table class="container">
            <thead>
            <tr class="blue">
                <th><h1>DATA</h1></th>
                <th><h1>HORA</h1></th>
                <th><h1>ESTADO</h1></th>
            </tr>
            </thead>
            <tbody class="item">
            <tr>
                <td>22/09/2021</td>
                <td>09:20</td>
                <td><i class="fa fa-clock-o" style="font-size:36px;color:red"></i></td>
            </tr>

            <?php 
                echo $linha;
            while($linha = mysqli_fetch_assoc($dados)){?>

            <tr>
            <td><?php echo $linha["ocorrencia"];?></td>
            <td><?php echo $linha["hora"];?></td>
            <td><?php echo date("d/m/Y", $linha["data"]);?></td>
            </tr>

            <?php } ?>
            
            </tbody>
        </table>
    </div>

    

        <h2>by <a>Integrated IP LLC</a></h2>


</body>

</html>