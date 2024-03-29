function request() {
    let lang = document.getElementById("lang").value;
	  let app_type = document.getElementById("app_type").value;
    let payload = document.getElementById("payload").value;
    let esme_url = document.getElementById("esme_url").value;
    let sms_text = document.getElementById("sms_text").value;
    let registered_delivery = document.getElementById("registered_delivery").value;
	
	let shortMessage = ""
	if(lang === "0"){
		shortMessage = btoa(sms_text) 
	}
  else {	
    shortMessage = encodeToUtf16(sms_text)
	}

    if (!validateForm(lang, payload, esme_url, sms_text)) {
        document.getElementById('request_packet').value = 'Please Fill All Required Field';

    } else {
        try {
			let request_data = ""
			if(app_type === "1"){
				
				request_xml = "<REQ>" +
                      "<FEATURE>submit_sm</FEATURE>" +
                      "<TIME-STAMP>25062009103510</TIME-STAMP>" +
                      "<RESPONSE-URL>http://localhost:8080/ESME/TestServlet</RESPONSE-URL>" +
                      "<PARAMETERS>" +
                      "<REQ-TRANSACTION-ID>0</REQ-TRANSACTION-ID>"+
                      "<SMSC-ID>airtel</SMSC-ID>" +
                      "<SUBMIT-SM>" +
                      "<SOURCE-ADDR>1234</SOURCE-ADDR>"+
                      "<DESTINATION-ADDR>9945626828</DESTINATION-ADDR>"+
                      "<ESM-CLASS>0</ESM-CLASS>"+
                      "<concatenatedSMesmClass>0</concatenatedSMesmClass>"+
                      "<DATA-CODING>"+lang+"</DATA-CODING>"+
                      "<SHORT-MESSAGE>"+shortMessage+"</SHORT-MESSAGE>"+
                      "</SUBMIT-SM>"+
                      "</PARAMETERS>"+
                    "</REQ>"
        
        request_data = prettifyXml(request_xml);
			}
			else {

        const request_json = {
          ...(registered_delivery === "true"?{featureId:"synch_submit_sm"}:{featureId:"submit_sm"}),
          timeStamp:25062009103510,
          respUrl:"http://localhost:8082/ESME/TestServlet",
          parameters: {
             reqTransactionId:0,
             smscId:"airtel",
             submitSm: {
                sourceAddr:1234,
                destinationAddr:11111111,
                dataCoding: lang,
                shortMessage: shortMessage,
               ...(payload==="true"?{messagePayload: true}:{}),
               ...(registered_delivery === "true"?{registeredDelivery: 1}:{}) 
             }
          }
       }

        request_data = JSON.stringify(request_json, null, 4)
			}

      console.log(request_data)    
			document.getElementById('request_packet').value = request_data;
        } catch (e) {
            document.getElementById('request_packet').value = e;
        }
    }
}


let copiedRequest = '';

function submit_request() {
    let esme_url = document.getElementById("esme_url").value;
    let data = document.getElementById('request_packet').value;
    copiedRequest = data;

    fetch(esme_url, {
        method: "POST",
        mode: "no-cors",
        headers: { 'Content-Type': 'application/json' },
        body: data
    }).then(res => {
        console.log("Request complete! response:", res);
    });
}

function copyRequest() {
    const textarea = document.getElementById('request_packet');
    // Select the text content of the textarea
    textarea.select();
    textarea.setSelectionRange(0, 99999); /* For mobile devices */
    // Copy the selected text to the clipboard
    document.execCommand('copy');
    // Deselect the text
    window.getSelection().removeAllRanges();
    // Optionally, provide user feedback
    //alert('Request packet copied to clipboard!');
}

function validateForm(lang, payload, esme_url, sms_text) {
    if (lang == null || lang == "" || payload == null || payload == "" || esme_url == null || esme_url == "" || sms_text == null || sms_text == "") {

        return false;
    }
    return true;
}

function toBinary(string) {
  const codeUnits = new Uint16Array(string.length);
  for (let i = 0; i < codeUnits.length; i++) {
    codeUnits[i] = string.charCodeAt(i);
  }
  const charCodes = new Uint8Array(codeUnits.buffer);
  let result = '';
  for (let i = 0; i < charCodes.byteLength; i++) {
    result += String.fromCharCode(charCodes[i]);
  }
  return result;
}

function encodeToUtf16(originalString){

  const codePoints = originalString.split('').map( char => char.charCodeAt(0) );
  const swapped = codePoints.map( val => (val>>8) | (val<<8) );
  const arr_BE = new Uint16Array( swapped );
  const result = btoa(
      new Uint8Array(arr_BE.buffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return result;
}

var prettifyXml = function(sourceXml)
{
    var xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml');
    var xsltDoc = new DOMParser().parseFromString([
        // describes how we want to modify the XML - indent everything
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
    ].join('\n'), 'application/xml');

    var xsltProcessor = new XSLTProcessor();    
    xsltProcessor.importStylesheet(xsltDoc);
    var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
    var resultXml = new XMLSerializer().serializeToString(resultDoc);
    return resultXml;
};
