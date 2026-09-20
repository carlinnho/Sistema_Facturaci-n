import { Injectable, Logger } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import { SignedXml } from 'xml-crypto';
import AdmZip from 'adm-zip';
import { TEST_PRIVATE_KEY, TEST_PUBLIC_CERT } from './certs';

@Injectable()
export class SunatService {
  private readonly logger = new Logger(SunatService.name);

  /**
   * Genera el XML en formato UBL 2.1 para Facturas y Boletas
   */
  generarXMLComprobante(venta: any, empresa: any): string {
    const isFactura = venta.tipo_comprobante === 'FACTURA';
    const tipoDocCode = isFactura ? '01' : '03';
    const serie = isFactura ? 'F001' : 'B001';
    const numero = venta.id_venta.toString().padStart(8, '0');
    const idComprobante = `${serie}-${numero}`;

    const totalIgv = venta.igv.toFixed(2);
    const subTotal = venta.subtotal.toFixed(2);
    const totalVenta = venta.total.toFixed(2);

    const xmlObj = {
      Invoice: {
        '@xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        '@xmlns:cac':
          'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        '@xmlns:cbc':
          'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
        '@xmlns:ext':
          'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',

        'ext:UBLExtensions': {
          'ext:UBLExtension': {
            'ext:ExtensionContent': {},
          },
        },

        'cbc:UBLVersionID': '2.1',
        'cbc:CustomizationID': '2.0',
        'cbc:ProfileID': '0101',
        'cbc:ID': idComprobante,
        'cbc:IssueDate': new Date().toISOString().split('T')[0],
        'cbc:IssueTime': new Date().toISOString().split('T')[1].substring(0, 8),

        'cbc:InvoiceTypeCode': {
          '@listID': '0101',
          '@listAgencyName': 'PE:SUNAT',
          '@listName': 'Tipo de Documento',
          '#': tipoDocCode,
        },

        'cbc:DocumentCurrencyCode': 'PEN',

        'cac:Signature': {
          'cbc:ID': empresa.ruc,
          'cac:SignatoryParty': {
            'cac:PartyIdentification': { 'cbc:ID': empresa.ruc },
            'cac:PartyName': { 'cbc:Name': empresa.razon_social },
          },
          'cac:DigitalSignatureAttachment': {
            'cac:ExternalReference': { 'cbc:URI': `#SIGN-EMPRESA` },
          },
        },
        'cac:AccountingSupplierParty': {
          'cac:Party': {
            'cac:PartyIdentification': {
              'cbc:ID': { '@schemeID': '6', '#': empresa.ruc },
            },
            'cac:PartyName': {
              'cbc:Name': empresa.nombre_comercial || empresa.razon_social,
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': empresa.razon_social,
              'cac:RegistrationAddress': {
                'cbc:AddressTypeCode': '0000',
                'cac:AddressLine': { 'cbc:Line': empresa.direccion },
              },
            },
          },
        },

        'cac:AccountingCustomerParty': {
          'cac:Party': {
            'cac:PartyIdentification': {
              'cbc:ID': {
                '@schemeID': isFactura
                  ? '6'
                  : venta.tipo_doc_cliente === 'DNI'
                    ? '1'
                    : '-',
                '#': venta.documento_cliente || '00000000',
              },
            },
            'cac:PartyLegalEntity': {
              'cbc:RegistrationName': venta.nombre_cliente,
            },
          },
        },

        // ── INSERCIÓN QUIRÚRGICA: OBLIGATORIO SOLO PARA FACTURAS ──
        ...(isFactura && {
          'cac:PaymentTerms': {
            'cbc:ID': 'FormaPago',
            'cbc:PaymentMeansID': 'Contado',
          },
        }),
        // ─────────────────────────────────────────────────────────

        'cac:TaxTotal': {
          'cbc:TaxAmount': { '@currencyID': 'PEN', '#': totalIgv },
          'cac:TaxSubtotal': {
            'cbc:TaxableAmount': { '@currencyID': 'PEN', '#': subTotal },
            'cbc:TaxAmount': { '@currencyID': 'PEN', '#': totalIgv },
            'cac:TaxCategory': {
              'cac:TaxScheme': {
                'cbc:ID': '1000',
                'cbc:Name': 'IGV',
                'cbc:TaxTypeCode': 'VAT',
              },
            },
          },
        },
        'cac:LegalMonetaryTotal': {
          'cbc:LineExtensionAmount': { '@currencyID': 'PEN', '#': subTotal },
          'cbc:TaxInclusiveAmount': { '@currencyID': 'PEN', '#': totalVenta },
          'cbc:PayableAmount': { '@currencyID': 'PEN', '#': totalVenta },
        },

        'cac:InvoiceLine': venta.detalles.map((det: any, index: number) => {
          const precioSinIgv = (det.precio_unitario / 1.18).toFixed(2);
          const subtotalLinea = (
            parseFloat(precioSinIgv) * det.cantidad
          ).toFixed(2);
          const igvLinea = (det.subtotal - parseFloat(subtotalLinea)).toFixed(
            2,
          );

          return {
            'cbc:ID': index + 1,
            'cbc:InvoicedQuantity': { '@unitCode': 'NIU', '#': det.cantidad },
            'cbc:LineExtensionAmount': {
              '@currencyID': 'PEN',
              '#': subtotalLinea,
            },
            'cac:PricingReference': {
              'cac:AlternativeConditionPrice': {
                'cbc:PriceAmount': {
                  '@currencyID': 'PEN',
                  '#': det.precio_unitario.toFixed(2),
                },
                'cbc:PriceTypeCode': '01',
              },
            },
            'cac:TaxTotal': {
              'cbc:TaxAmount': { '@currencyID': 'PEN', '#': igvLinea },
              'cac:TaxSubtotal': {
                'cbc:TaxableAmount': {
                  '@currencyID': 'PEN',
                  '#': subtotalLinea,
                },
                'cbc:TaxAmount': { '@currencyID': 'PEN', '#': igvLinea },
                'cac:TaxCategory': {
                  'cbc:Percent': '18.00',
                  'cbc:TaxExemptionReasonCode': '10',
                  'cac:TaxScheme': {
                    'cbc:ID': '1000',
                    'cbc:Name': 'IGV',
                    'cbc:TaxTypeCode': 'VAT',
                  },
                },
              },
            },
            'cac:Item': {
              'cbc:Description': det.nombre_producto,
              'cac:SellersItemIdentification': { 'cbc:ID': det.sku_producto },
            },
            'cac:Price': {
              'cbc:PriceAmount': { '@currencyID': 'PEN', '#': precioSinIgv },
            },
          };
        }),
      },
    };

    const xmlDocument = create(
      { version: '1.0', encoding: 'UTF-8' },
      xmlObj,
    ).end({ prettyPrint: false });

    this.logger.log(`XML Generado exitosamente para ${idComprobante}`);
    return xmlDocument;
  }

  /**
   * Firma el XML usando xml-crypto v6.1.2 (Estándar UBL 2.1 SUNAT)
   */
  firmarXML(xmlSinFirma: string): string {
    try {
      const certClean = TEST_PUBLIC_CERT.replace(
        /-----BEGIN CERTIFICATE-----/g,
        '',
      )
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/[\r\n]/g, '');

      const xmlParaFirmar = xmlSinFirma.startsWith('<?xml')
        ? xmlSinFirma.substring(xmlSinFirma.indexOf('?>') + 2).trim()
        : xmlSinFirma.trim();

      const sig = new SignedXml({
        privateKey: TEST_PRIVATE_KEY,
        publicCert: certClean,
        signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
        canonicalizationAlgorithm:
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        getKeyInfoContent: () =>
          `<ds:X509Data><ds:X509Certificate>${certClean}</ds:X509Certificate></ds:X509Data>`,
      });

      const OriginalC14n = (sig as any).CanonicalizationAlgorithms[
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ];
      (sig as any).CanonicalizationAlgorithms[
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ] = function () {
        this.process = function (node: any, options: any) {
          const invoiceNode =
            node.localName === 'Invoice' ? node : node.documentElement || null;
          if (invoiceNode && invoiceNode.localName === 'Invoice') {
            if (invoiceNode.removeAttribute) {
              invoiceNode.removeAttribute('Id');
              invoiceNode.removeAttribute('id');
              invoiceNode.removeAttribute('ID');
            }
          }

          if (node.localName === 'SignedInfo') {
            const refs = node.getElementsByTagName('*');
            for (let i = 0; i < refs.length; i++) {
              if (
                refs[i].localName === 'Reference' &&
                refs[i].getAttribute('URI') === '#_0'
              ) {
                refs[i].setAttribute('URI', '');
              }
            }
          }

          const c14n = new OriginalC14n();
          return c14n.process(node, options);
        };
        this.getAlgorithmName = () =>
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
      };

      sig.addReference({
        xpath: "//*[local-name(.)='Invoice']",
        transforms: [
          'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        ],
        digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
      });

      sig.computeSignature(xmlParaFirmar, {
        location: {
          reference: "//*[local-name(.)='ExtensionContent']",
          action: 'append',
        },
      });

      let xmlFirmado = sig.getSignedXml();

      xmlFirmado = xmlFirmado.replace(/(<Invoice\b[^>]*?)\s+Id="[^"]*"/i, '$1');
      xmlFirmado = xmlFirmado.replace(
        /(<[^>]*?Reference\b[^>]*?URI=")#[^"]*"/g,
        '$1"',
      );

      const xmlFinal = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlFirmado}`;

      this.logger.log(
        'XML firmado criptográficamente con éxito (v6.1.2 - Sincronización Total).',
      );
      return xmlFinal;
    } catch (error) {
      this.logger.error('Error al firmar el XML', error);
      throw error;
    }
  }

  /**
   * Enviar a SUNAT (Entorno BETA)
   */
  async enviarASunatBETA(
    xmlFirmado: string,
    rucEmpresa: string,
    idComprobante: string,
    tipoDocCode: string,
  ): Promise<string | null> {
    try {
      const partes = idComprobante.split('-');
      const serie = partes[0];
      const numero = partes[1];

      const fileName = `${rucEmpresa}-${tipoDocCode}-${serie}-${numero}`;

      const zip = new AdmZip();
      zip.addFile(`${fileName}.xml`, Buffer.from(xmlFirmado, 'utf8'));
      const zipBuffer = zip.toBuffer();

      const base64Zip = zipBuffer.toString('base64');

      const soapMessage = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ser="http://service.sunat.gob.pe"
  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${rucEmpresa}MODDATOS</wsse:Username>
        <wsse:Password>MODDATOS</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:sendBill>
      <fileName>${fileName}.zip</fileName>
      <contentFile>${base64Zip}</contentFile>
    </ser:sendBill>
  </soapenv:Body>
</soapenv:Envelope>`;

      this.logger.log(`Enviando ${fileName}.zip a SUNAT BETA...`);

      const response = await fetch(
        'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            SOAPAction: 'urn:sendBill',
          },
          body: soapMessage,
        },
      );

      const responseText = await response.text();

      if (!response.ok) {
        this.logger.error(
          `Error HTTP desde SUNAT: ${response.status} ${response.statusText}`,
        );
        this.logger.error(`Detalle: ${responseText}`);
        return null;
      }

      const match = responseText.match(
        /<applicationResponse>([^<]+)<\/applicationResponse>/,
      );

      if (match && match[1]) {
        this.logger.log('¡Respuesta recibida de SUNAT! Descomprimiendo CDR...');
        const cdrZipBase64 = match[1];

        const responseZip = new AdmZip(Buffer.from(cdrZipBase64, 'base64'));
        const zipEntries = responseZip.getEntries();

        let cdrStatus = 'Desconocido';

        for (const entry of zipEntries) {
          if (entry.entryName.endsWith('.xml')) {
            const cdrXml = responseZip.readAsText(entry);
            const statusMatch = cdrXml.match(
              /<cbc:Description>([^<]+)<\/cbc:Description>/,
            );
            if (statusMatch) cdrStatus = statusMatch[1];

            console.log('\n========== RESPUESTA DE SUNAT (CDR) ==========');
            console.log(cdrStatus);
            console.log('==============================================\n');
          }
        }

        return cdrStatus;
      } else {
        this.logger.warn('SUNAT respondió sin CDR. Respuesta raw:');
        console.log(responseText);
        return null;
      }
    } catch (error) {
      this.logger.error('Error enviando a SUNAT', error);
      throw error;
    }
  }
}
