import axios from "axios";
const base_url = "https://api.tiny.com.br/api2/";

export const apiTiny = async (apiUrl, data = [], method = "GET") => {
  let body = "";
  const params = new URLSearchParams();
  for (let item of data) {
    if (typeof item.value == "object")
      body = `&${item.key}=` + JSON.stringify(item.value);
    else params.append(item.key, item.value);
  }
  //console.log('os parametros antes de enviara para api Tiny : ' + JSON.stringify(data) )
  //console.log('O conteudo da variavel parametro é : ' +parametro )
  //tem que fazer testes ao enviar um produto ou quando envia objetos no parametro ....
  //oque foi testando foi o envio do estoque que é json curto ... Beleza !!!   21-12-2022

  try {
    const response = await axios({
      method,
      url: `${base_url}${apiUrl}?${params.toString()}${body}`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    return response;
  } catch (error) {
    console.log(error);
    return [];
  }
};
