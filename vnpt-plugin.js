(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD (RequireJS)
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS (Node.js)
        module.exports = factory();
    } else {
        // Global (browser)
        root.vnptPlugin = factory();
    }
}(this, function () {
    /************************************************************************/
    /*                      VNPT-CA PLUGIN JS LIBRARY                       */
    /* Version: 1.0.3.4                                                     */
    /* Author: TUANTA                                                       */
    /* Copyright (c) 2018 VNPT-IT                                           */
    /************************************************************************/

    var functionId = {
        GetCertInfo             : 0,
        SignXML: 1,
        SignPDF                 : 2,
        SignOFFICE              : 3,
        SignCMS: 4,
        chooseFile              : 5,
        setLicenseKey           : 6,
        checkPlugin             : 7,
        signArrData: 8,
        signHash: 9,
        signArrDataAdvanced     : 10,
        getVersion              : 11,
        SignPDFMultiplePages    : 12,
        ValidateCertificate		: 14,
        ValidateCertificateBase64: 15,
        CheckValidTime: 16,
        CheckValidTimeBase64: 17,
        CheckOCSP: 18,
        CheckOCSPBase64: 19,
        ShowCertificateViewer   : 20,
        CheckCRL: 21,
        CheckCRLBase64: 22,
        SetLanguage             : 23,
        Scan                    : 24,
        OpenDocument            : 25,
        BatchScan               : 26,
        HandleFile              : 27,
        DeleteFile              : 28,
        SetIgnoreListFiles      : 29,
        GetAllFiles             : 30,
        GetFilePreview          : 31,    
        GetDataScanned          : 33,
        CheckToken: 34,
        SetGetCertFromUsbToken: 35,
        SetGetCertByPkcs11: 36,	
        SetShowCertListDialog   : 37,
        ConvertOfficeToPdf      : 38,    
        ViewValidFile           : 39,
        ClearPinCache: 40,
        VerifyPdf               : 42,
        VerifyPdfAdvanced       : 43,
        OpenDwgFile: 44,
        GetAllCertificates : 45,
        AddIssuerCert : 46,
        GetAllCertificatesBase64 : 47,
        SignArrDataSmartCA : 50,
        GetCertsSmartCA : 51,
        OpenDocumentLSN: 2019,
        CheckThread: 2020
        // NOTE: Khi thêm function lưu ý set ID > 44 để tránh conflict với các function khác
    };

    // Variables
    var ports = [4433, 4434, 4435, 9201, 9202];
    var currentID = 0;
    var webSocket;
    var vnptCheckPluginCallback;
    var pluginSignal;
    var timeOut = 3000;
    var checkPluginCall = -1; // -1 - chua call, 1 - da call
    var pluginStatus = 0;  // -1: failed, 0: chua check, 1: Da check
    var checkPluginRejectCallback;

    // Utils
    function getLastError(data) {
        console.log(data);
    }
    function get_browser() {
        var ua = navigator.userAgent, tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return { name: 'IE', version: (tem[1] || '') };
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem != null) {
                //return tem.slice(1).join(' ').replace('OPR', 'Opera');
                return {
                    name: tem.slice(1)[0].replace('OPR', 'Opera'),
                    version: tem.slice(1)[1]
                };
            }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
        //return M.join(' ');
        return {
            name: M[0],
            version: M[1]
        };
    };
    function getOsName() {
        var OSName = "Unknown";
        if (window.navigator.userAgent.indexOf("Windows NT 10.0") != -1) OSName = "Windows 10";
        if (window.navigator.userAgent.indexOf("Windows NT 6.2") != -1) OSName = "Windows 8";
        if (window.navigator.userAgent.indexOf("Windows NT 6.1") != -1) OSName = "Windows 7";
        if (window.navigator.userAgent.indexOf("Windows NT 6.0") != -1) OSName = "Windows Vista";
        if (window.navigator.userAgent.indexOf("Windows NT 5.1") != -1) OSName = "Windows XP";
        if (window.navigator.userAgent.indexOf("Windows NT 5.0") != -1) OSName = "Windows 2000";
        if (window.navigator.userAgent.indexOf("Mac") != -1) OSName = "MAC";
        if (window.navigator.userAgent.indexOf("X11") != -1) OSName = "UNIX";
        if (window.navigator.userAgent.indexOf("Linux") != -1) OSName = "Linux";
        return OSName;
    }
    function downgradePdfSignerOption(pdfSignerNew) {
        var pdfSignerOld = new PdfSigner_oldVersion();
        pdfSignerOld.page = pdfSignerNew.page ? pdfSignerNew.page : 1;
        pdfSignerOld.llx = pdfSignerNew.llx ? pdfSignerNew.llx : 0;
        pdfSignerOld.lly = pdfSignerNew.lly ? pdfSignerNew.lly : 0;
        pdfSignerOld.urx = pdfSignerNew.urx ? pdfSignerNew.urx : 150;
        pdfSignerOld.ury = pdfSignerNew.ury ? pdfSignerNew.ury : 75;
        pdfSignerOld.SigTextSize = pdfSignerNew.SigTextSize ? pdfSignerNew.SigTextSize : 9;
        pdfSignerOld.Signer = pdfSignerNew.Signer;
        pdfSignerOld.SignerPosition = pdfSignerNew.SignerPosition;
        pdfSignerOld.SigningTime = pdfSignerNew.SigningTime; // HH:mm:ss dd/MM/yyyy
        pdfSignerOld.Description = pdfSignerNew.Description;
        pdfSignerOld.ImageBase64 = pdfSignerNew.ImageBase64;
        pdfSignerOld.OnlyDescription = (pdfSignerNew.OnlyDescription === null || pdfSignerNew.OnlyDescription === undefined) ? false : pdfSignerNew.OnlyDescription;
        pdfSignerOld.ValidationOption = (pdfSignerNew.ValidationOption === null || pdfSignerNew.ValidationOption === undefined) ? false : pdfSignerNew.ValidationOption;
        pdfSignerOld.SigColorRGB = pdfSignerNew.SigColorRGB;
        pdfSignerOld.SetImageBackground = (pdfSignerNew.SetImageBackground === null || pdfSignerNew.SetImageBackground === undefined) ? false : pdfSignerNew.SetImageBackground;
        pdfSignerOld.PagesArray = pdfSignerNew.PagesArray;
        pdfSignerOld.CertificateSerial = pdfSignerNew.CertificateSerial;
        pdfSignerOld.TsaUrl = pdfSignerNew.TsaUrl;
        pdfSignerOld.TsaUsername = pdfSignerNew.TsaUsername;
        pdfSignerOld.TsaPassword = pdfSignerNew.TsaPassword;
        pdfSignerOld.AdvancedCustom = (pdfSignerNew.AdvancedCustom === null || pdfSignerNew.AdvancedCustom === undefined) ? false : pdfSignerNew.AdvancedCustom;
        pdfSignerOld.SigType = pdfSignerNew.SigType ? pdfSignerNew.SigType : 0;
        pdfSignerOld.IsEncyptFile = (pdfSignerNew.IsEncyptFile === null || pdfSignerNew.IsEncyptFile === undefined) ? false : pdfSignerNew.IsEncyptFile;
        pdfSignerOld.EncryptPassword = pdfSignerNew.EncryptPassword;
        pdfSignerOld.SigVisible = (pdfSignerNew.SigVisible === null || pdfSignerNew.SigVisible === undefined) ? true : pdfSignerNew.SigVisible;
        pdfSignerOld.SigSignerVisible = (pdfSignerNew.SigSignerVisible === null || pdfSignerNew.SigSignerVisible === undefined) ? true : pdfSignerNew.SigSignerVisible;
        pdfSignerOld.SigEmailVisible = (pdfSignerNew.SigEmailVisible === null || pdfSignerNew.SigEmailVisible === undefined) ? true : pdfSignerNew.SigEmailVisible;
        pdfSignerOld.SigPositionVisible = (pdfSignerNew.SigPositionVisible === null || pdfSignerNew.SigPositionVisible === undefined) ? false : pdfSignerNew.SigPositionVisible;
        pdfSignerOld.SigSigningTimeVisible = (pdfSignerNew.SigSigningTimeVisible === null || pdfSignerNew.SigSigningTimeVisible === undefined) ? true : pdfSignerNew.SigSigningTimeVisible;
        return pdfSignerOld;
    }
    function getFunctionCallbackName(funcCallback) {
        if (funcCallback) {
            if ((navigator.userAgent.indexOf("MSIE") !== -1) || (!!document.documentMode === true))
                return funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
            else
                return funcCallback.name;
        }
        else {
            return "callbackDefault";
        }
    }

    // VNPT PLUGIN OBJECT
    var vnpt_plugin = {
        // Communicate plugin 
        connect: function (port, data) {
            if ((get_browser().name === "IE" || get_browser().name === "MSIE") && (navigator.userAgent.indexOf("Windows NT 10.0") === -1)) {
                console.log("The browser not support");
            }
            else {
                return new Promise(function (success, reject) {
                    if (currentID === 0) {
                        checkPluginRejectCallback = success;
                    }
                    if (webSocket === null || pluginStatus !== 1) {
                        webSocket = new WebSocket("wss://localhost:" + port + "/plugin");
                        timer = setTimeout(function () {
                            var s = webSocket;
                            webSocket = null;
                            s.close();
                            currentID++;
                            vnpt_plugin.tryConnect(data, success, reject);
                        }, timeOut);
                    }
                    else {
                        // do something when connected
                        webSocket.send(data);
                    }
                    // opened
                    webSocket.onopen = function () {
                        pluginStatus = 1;
                        clearTimeout(timer); // clear 	            
                        webSocket.send(data);
                    },
                        // closed
                        webSocket.onclose = function () {
                            pluginStatus = 0;
                        },
                        // message
                        webSocket.onmessage = function (message) {
                            // handle data	     
                            var result = message.data;
                            var resSplit = result.split("*");
                            // check plugin
                            if (checkPluginCall === 1) {
                                checkPluginCall = -1;
                                if (resSplit[0] === "1") {
                                    timeOut = 5000;
                                }
                            }
                            // return
                            if (resSplit[1] === "callbackDefault") {
                                success(resSplit[0]);
                            }
                            else {
                                window[resSplit[1]](resSplit[0]);
                            }
                        },
                        // error
                        webSocket.onerror = function () {
                            //console.log("Error");
                            pluginStatus = 0;
                            //reject("Catch Error");
                            if (currentID === 2) {
                                if (vnptCheckPluginCallback === null) {
                                    reject("-1");
                                }
                                else {
                                    vnptCheckPluginCallback("-1");
                                }
                            }
                        }
                });
            }
        },
        tryConnect: function (data, success, reject) {
            if (currentID < 3) {
                this.connect(ports[currentID], data).then(function (data) {
                    success(data);
                });
            }
            else {
                currentID = 0
                checkPluginRejectCallback("-1");
            }
        },
        sendMessageToPlugin: function (data) {
            data.domain = window.location.hostname;
            if (data.domain === "") {
                data.domain = window.location.href;
            }
            var jsData = "";
            jsData += JSON.stringify(data);
            return this.connect(ports[currentID], jsData);
        },
        signXML: function (data, funcCallback, xmlSigner) {
            var callInfo = {};
            callInfo.functionID = functionId.SignXML;

            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }

            if (xmlSigner == null) {
                var args = [
                    data
                ];
                callInfo.args = args;
            }
            else {
                var pramaters = JSON.stringify(xmlSigner);
                var args = [
                    data,
                    pramaters
                ];
                callInfo.args = args;
            }

            return this.sendMessageToPlugin(callInfo);
        },
        // Features
        signPdf: function (data, funcCallback, pdfSigner) {
            var callInfo = {};
            callInfo.functionID = functionId.SignPDF;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            if (!pdfSigner) {
                var args = [
                    data
                ];
                callInfo.args = args;
            }
            else {
                if (this.getOsName() === "MAC") {
                    var pdfSignerOld = downgradePdfSignerOption(pdfSigner);
                    var pramaters = JSON.stringify(pdfSignerOld);
                    var args = [
                        data,
                        pramaters
                    ];
                    callInfo.args = args;
                }
                else {
                    var pramaters = JSON.stringify(pdfSigner);
                    var args = [
                        data,
                        pramaters
                    ];
                    callInfo.args = args;
                }
            }

            return this.sendMessageToPlugin(callInfo);
        },
        signHash: function (data, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.signHash;

            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }

            var args = [
                data
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        signCms: function (data, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.SignCMS;

            if (funcCallback !== null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }

            var args = [
                data
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        signOffice: function (data, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.SignOFFICE;

            callInfo.funcCallback = getFunctionCallbackName(funcCallback);

            var args = [
                data
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        SignPDFMultiplePages: function (data, funcCallback, pdfSigner) {
            var callInfo = {};
            callInfo.functionID = functionId.SignPDFMultiplePages;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            if (!pdfSigner) {
                consle.log("Pdf signature options not found!");
                return;
            }
            else {
                var pramaters = JSON.stringify(pdfSigner);
                var args = [
                    data,
                    pramaters
                ];
                callInfo.args = args;
            }
            return this.sendMessageToPlugin(callInfo);
        },
        signArrData: function (arrData, type, sigOption, serial, clearPINCache, funcCallback) {
            var callInfo = {};
            var clearPIN = "0";
            if (clearPINCache != null && clearPINCache)
                clearPIN = "1";
            var jsArr = JSON.stringify(arrData);
            callInfo.functionID = functionId.signArrData;

            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            /// pramaters
            if (sigOption == null) {
                var args = [
                    jsArr,
                    type,
                    serial,
                    clearPIN
                ];
                callInfo.args = args;
            }
            else {
                var sigOtions = JSON.stringify(sigOption);
                var args = [
                    jsArr,
                    type,
                    serial,
                    clearPIN,
                    sigOtions
                ];
                callInfo.args = args;
            }
            return this.sendMessageToPlugin(callInfo);
        },
        signArrDataAdvanced: function (arrData, serial, clearPINCache, funcCallback, showCertList) {
            var callInfo = {};
            var clearPIN = "0";
            if (clearPINCache)
                clearPIN = "1";
            var isShowCertList = "1";
            if (showCertList !== null && showCertList !== undefined && !showCertList)
                isShowCertList = "0";

            var jsArr = JSON.stringify(arrData);
            callInfo.functionID = functionId.signArrDataAdvanced;

            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                jsArr,
                serial,
                clearPIN,
                isShowCertList
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        getCertInfo: function (funcCallback, isOnyFromToken) {
            var callInfo = {};
            callInfo.functionID = functionId.GetCertInfo;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var isOnyToken = "0";
            if (isOnyFromToken !== null && isOnyFromToken)
                isOnyToken = "1";
            var args = [
                isOnyToken
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        chooseFile: function (funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.chooseFile;

            callInfo.funcCallback = getFunctionCallbackName(funcCallback);

            var args = [
                ""
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        setLicenseKey: function (license, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.setLicenseKey;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                license
            ];
            callInfo.args = args;
            // callInfo.domain = window.location.hostname;
            // if (callInfo.domain === "")
            // {
            // callInfo.domain = window.location.href;
            // }
            return this.sendMessageToPlugin(callInfo);
        },
        SetGetCertFromUsbToken: function (isOnyFromToken, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.SetGetCertFromUsbToken;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var isOnyToken = "1";
            if (isOnyFromToken != null && !isOnyFromToken)
                isOnyToken = "0";
            var args = [
                isOnyToken
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        SetGetCertByPkcs11: function (usePkcs11, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.SetGetCertByPkcs11;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var isUsePkcs11 = "1";
            if (usePkcs11 != null && !usePkcs11)
                isUsePkcs11 = "0";
            var args = [
                isUsePkcs11
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        setLanguage: function (language, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.SetLanguage;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                language
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        SetShowCertListDialog: function (isShowDialog, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.SetShowCertListDialog;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var showListCert = "1";
            if (isShowDialog != null && !isShowDialog)
                showListCert = "0";
            var args = [
                showListCert
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        ValidateCertificate: function (serialNumber, timeCheck, ocspUrl, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.ValidateCertificate;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                serialNumber,
                timeCheck,
                ocspUrl
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        ValidateCertificateBase64: function (certBase64, timeCheck, ocspUrl, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.ValidateCertificateBase64;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                certBase64,
                timeCheck,
                ocspUrl
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        CheckValidTime: function (serialNumber, timeCheck, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.CheckValidTime;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                serialNumber,
                timeCheck
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        CheckValidTimeBase64: function (certBase64, timeCheck, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.CheckValidTimeBase64;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                certBase64,
                timeCheck
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        ShowCertificateViewer: function (certBase64, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.ShowCertificateViewer;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                certBase64
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        CheckOCSP: function (serialNumber, timeCheck, ocspUrl, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.CheckOCSP;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                serialNumber,
                timeCheck,
                ocspUrl
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        CheckOCSPBase64: function (certBase64, timeCheck, ocspUrl, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.CheckOCSPBase64;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                certBase64,
                timeCheck,
                ocspUrl
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        CheckCRL: function (serialNumber, timeCheck, crlUrl, crlBase64, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.CheckCRL;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                serialNumber,
                timeCheck,
                crlUrl,
                crlBase64
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        CheckCRLBase64: function (certBase64, timeCheck, crlUrl, crlBase64, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.CheckCRLBase64;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                certBase64,
                timeCheck,
                crlUrl,
                crlBase64
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        CheckToken: function (funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.CheckToken;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                ""
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        checkPlugin: function (funcCallback) {
            vnptCheckPluginCallback = funcCallback;

            checkPluginCall = 1;
            timeOut = 3000;

            var callInfo = {};
            callInfo.functionID = functionId.checkPlugin;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                ""
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        getVersion: function (funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.getVersion;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                ""
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        Scan: function (iSaveFile, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.Scan;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var saveFileScanned = 0;
            if (iSaveFile !== undefined && iSaveFile !== null && iSaveFile) {
                saveFileScanned = 1;
            }
            var args = [
                saveFileScanned
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        GetDataScanned: function (path, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.GetDataScanned;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                path
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        OpenDocument: function (data, name, type, options, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.OpenDocument;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                data,
                name,
                type,
                options
            ];

            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        ClearPinCache: function (times, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.ClearPinCache;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                times
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        GetAllCertificates: function (funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.GetAllCertificates;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                ""
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        AddIssuerCert: function (certBase64,funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.AddIssuerCert;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                certBase64
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        GetAllCertificatesBase64: function (funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.GetAllCertificatesBase64;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var args = [
                ""
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        SignArrDataSmartCA: function (funcCallback,sigOpts, uid, serialNumber) {
            var callInfo = {};
            callInfo.functionID = functionId.SignArrDataSmartCA;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }        
            var jsArr = JSON.stringify(sigOpts);
            var args = [
                jsArr,
                uid,
                serialNumber
            ];        
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        GetCertsSmartCA: function (funcCallback,uid) {
            var callInfo = {};
            callInfo.functionID = functionId.GetCertsSmartCA;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }        
            
            var args = [
                uid
            ];        
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },

        // LSN
        OpenDocumentLSN: function (key, docid, fileid, acc, url, data, name, type, newname_nopath,newpathfile, oldpathfile, options, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.OpenDocumentLSN;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                key,
                docid,
                fileid,
                acc,
                url,
                data,
                name,
                type,
                newname_nopath,
                newpathfile,
                oldpathfile,
                options
            ];

            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },

        CheckThread: function (files, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.CheckThread;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                files
            ];

            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        // End LSN

        OpenDwgDocument: function (data, name, type, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.OpenDwgFile;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                data,
                name,
                type
            ];

            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        ConvertOfficeToPdf: function (data, type, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.ConvertOfficeToPdf;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                data,
                type
            ];

            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        BatchScan: function (options, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.BatchScan;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var scanner = new Scanner();
            scanner.options = options;
            var pramaters = JSON.stringify(scanner);

            var args = [
                pramaters
            ];

            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        HandleFile: function (funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.HandleFile;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                ""
            ];

            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        DeleteFile: function (path, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.DeleteFile;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                path
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        SetIgnoreListFiles: function (list, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.SetIgnoreListFiles;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                list
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        GetAllFiles: function (directory, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.GetAllFiles;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                directory
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        GetFilePreview: function (path, pageStart, pageEnd, funcCallback) {
            vnptCheckPluginCallback = funcCallback;
            var callInfo = {};
            callInfo.functionID = functionId.GetFilePreview;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                path,
                pageStart,
                pageEnd
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        checkBrowser: function () {
            var browser = get_browser();
            switch (browser.name.toLowerCase()) {
                case "chrome":
                    if (browser.version > 52) {
                        return true;
                    }
                case "firefox":
                    if (browser.version > 49) {
                        return true;
                    }
                case "opera":
                    if (browser.version > 26) {
                        return true;
                    }
                case "edge":
                    if (browser.version > 15) {
                        return true;
                    }
                case "ie":
                    if (browser.version > 6) {
                        return true;
                    }
                case "msie":
                    if (browser.version > 6) {
                        return true;
                    }
                case "safari":
                    if (browser.version > 10) {
                        return true;
                    }
                default:
                    console.log("Browser not supported yet");
                    return false;
            }
        },
        checkBrowserSupportWS: function () {
            var browser = get_browser();
            switch (browser.name.toLowerCase()) {
                case "chrome":
                    if (browser.version > 52) {
                        return true;
                    }
                case "firefox":
                    if (browser.version > 49) {
                        return true;
                    }
                case "opera":
                    if (browser.version > 26) {
                        return true;
                    }
                case "edge":
                    if (browser.version > 15) {
                        return true;
                    }
                case "ie":
                    return false;
                case "msie":
                    return false;
                case "safari":
                    if (browser.version > 10) {
                        return true;
                    }
                default:
                    console.log("Browser not supported yet");
                    return false;
            }
        },
        getOsName: function () {
            return getOsName();
        },
        viewValidFile: function (data, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.ViewValidFile;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var args = [
                data
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        VerifyPdf: function (data, iCheckOcsp, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.VerifyPdf;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var valOtion = "0";
            if (iCheckOcsp !== null && iCheckOcsp !== undefined && iCheckOcsp) {
                valOtion = "1";
            }
            var args = [
                data,
                valOtion
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        VerifyPdfAdvanced: function (data, iCheckOcsp, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.VerifyPdfAdvanced;
            callInfo.funcCallback = getFunctionCallbackName(funcCallback);
            var valOtion = "0";
            if (iCheckOcsp != null && iCheckOcsp != undefined && iCheckOcsp) {
                valOtion = "1";
            }
            var args = [
                data,
                valOtion
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        }
    };

    //
    var VNPT_PLUGIN_LANGUAGE = {
        EN: "en_US",
        VI: "vi_vn",
        LAO: "la_lao"
    };
    //
    function Scanner() {
        this.cookie = null;
        this.options = null;
        this.uplink = null;
        this.downlink = null;
        this.path = null;

    }
    //
    function PdfSigner() {
        this.page = null;
        this.llx = null;
        this.lly = null;
        this.urx = null;
        this.ury = null;

        this.SigTextSize = null;
        this.Signer = null;
        this.SignerPosition = null;
        this.SigningTime = null; // HH:mm:ss dd/MM/yyyy
        this.Description = null;
        this.ImageBase64 = null;
        this.OnlyDescription = null;
        this.ValidationOption = null;
        this.SigColorRGB = null;
        this.SetImageBackground = null;
        this.PagesArray = null;
        this.CertificateSerial = null;
        this.TsaUrl = null;
        this.TsaUsername = null;
        this.TsaPassword = null;
        this.AdvancedCustom = false; // show form custom if set true
        this.AdvancedWithoutDisplay = false;
        this.SigType = null;		 // Kieu ky: 0 - ky chi mo ta, 1 - mo ta + anh, 2 - chi anh
        this.IsEncyptFile = null;    // Ma hoa file hay khong
        this.EncryptPassword = null; // MK ma hoa
        this.SigVisible = null; 	 // Hien thi chu ky hay k?
        this.SigSignerVisible = null;// Hien thi nguoi ky
        this.SigEmailVisible = null; // Hien thi email
        this.SigPositionVisible = null;// Hien thi chuc vu
        this.SigCompanyVisible = null;// Hien thi to chuc
        this.SigSigningTimeVisible = null; // Hien thi thoi gian 
        // so van ban
        this.DocumentNumber = null;
        this.DocumentNumberRec = null;
        this.DocumentNumberPage = null;
        // ngay van ban
        this.DocumentDate = null;
        this.DocumentDateRec = null;
        this.DocumentDatePage = null;
        this.listComment = null;
        // 
        this.sigUpperCase = null;
        this.sigBold = null;
        this.labelDescription = null;
        //
        this.overideSigInfo = null;
        this.overideSigFormat = null;
        this.overideSigCoordinate = null;
        //
        this.commentItalic = null;
        this.commentFontSize = null;
        this.docNumberItalic = null;
        this.docDateItalic = null;
        this.sigAllPages = null;
        //
        this.sigCombineCNAndOU = null;
        this.sigOULabel = null;
        this.textAlignBottom = null;
        //
        this.DigestAlgorithm = "SHA1"; // Hash algorithm
    }

    function OfficeSigner() {
        this.DigestAlgorithm = "SHA1"; // Hash algorithm
    }
    function CmsSigner() {
        this.DigestAlgorithm = "SHA1"; // Hash algorithm
    }
    // Features has not support yet
    function XmlSigner() {
        this.TagSigning = null;
        this.NodeToSign = null;
        this.TagSaveResult = null;
        this.ParrentTagSigning = null;
        this.NameXPathFilter = null;
        this.NameIDTimeSignature = null;
        this.DsSignature = false;
        this.SigningType = "Enveloped";
        this.SigningTime = null; // HH:mm:ss dd/MM/yyyy
        this.CertificateSerial = null;
        this.ValidateBefore = false;
        this.DigestMethod = "SHA1"; // Hash algorithm
        this.SignatureMethod = "RSAwithSHA1"; //OR RSAwithSHA256
    }



    // 
    function PdfSigner_oldVersion() {
        this.page = 1;
        this.llx = 0;
        this.lly = 0;
        this.urx = 150;
        this.ury = 75;
        this.SigTextSize = 9;
        this.Signer = null;
        this.SignerPosition = null;
        this.SigningTime = null; // HH:mm:ss dd/MM/yyyy
        this.Description = null;
        this.ImageBase6 = null;
        this.OnlyDescription = false;
        this.ValidationOption = true;
        this.SigColorRGB = null;
        this.SetImageBackground = false;
        this.PagesArray = null;
        this.CertificateSerial = null;
        this.TsaUrl = null;
        this.TsaUsername = null;
        this.TsaPassword = null;
        this.AdvancedCustom = false; // show form custom if set true
        this.SigType = 0;			 // Kieu ky: 0 - ky chi mo ta, 1 - mo ta + ten, 2 - mo ta + anh, chi anh
        this.IsEncyptFile = false;   // Ma hoa file hay khong
        this.EncryptPassword = null; // MK ma hoa
        this.SigVisible = true; 	 // Hien thi chu ky hay k?
        this.SigSignerVisible = true;// Hien thi nguoi ky
        this.SigEmailVisible = true; // Hien thi chu ky hay k?
        this.SigPositionVisible = false;// Hien thi chu ky hay k?
        this.SigSigningTimeVisible = true; // Hien thi chu ky hay k?    
    }
    //
    function RectangleCustom() {
        this.llx = 0;
        this.lly = 0;
        this.urx = 0;
        this.ury = 0;
        this.page = 0;
    }

    return vnpt_plugin;
}));

