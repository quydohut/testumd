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
    // Nội dung file signToken.js
    var functionId = {
        GetCertInfo: 0,
        SignXML: 1,
        SignPDF: 2,
        SignOFFICE: 3,
        SignCMS: 4,
        chooseFile: 5,
        setLicenseKey: 6,
        checkPlugin: 7,
        signArrData: 8,
        signHash: 9,
        signArrDataAdvanced: 10,
        getVersion: 11,
        SignPDFMultiplePages: 12,
        checkPluginAdvanced: 13,
        ValidateCertificate: 14,
        ValidateCertificateBase64: 15,
        CheckValidTime: 16,
        CheckValidTimeBase64: 17,
        CheckOCSP: 18,
        CheckOCSPBase64: 19,
        ShowCertificateViewer: 20,
        CheckCRL: 21,
        CheckCRLBase64: 22,
        SetLanguage: 23,
        Scan: 24,
        OpenDocument: 25,
        BatchScan: 26,
        HandleFile: 27,
        DeleteFile: 28,
        SetIgnoreListFiles: 29,
        GetAllFiles: 30,
        GetFilePreview: 31,
        UploadFile: 32,
        GetDataScanned: 33,
        CheckToken: 34,
        SetGetCertFromUsbToken: 35,
        SetGetCertByPkcs11: 36,
        SetShowCertListDialog: 37,
        ConvertOfficeToPdf: 38,
        GetComputerInfo: 39,
        ClearPinCache: 40,
        GetAllCertificates: 45,
        AddIssuerCert: 46,
        GetAllCertificatesBase64: 47,
    };
    var ports = [4433, 4434, 4435, 9201, 9202, 5002, 5003];
    var currentID = 0;
    var timeOut = 3000;
    var webSocket;
    var vnptCheckPluginCallback;
    var checkPluginCall = -1;
    var pluginLicenseKey = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PExpY2Vuc2U+PFBoYW5NZW0+Vk5QVC1DQSBQbHVnaW48L1BoYW5NZW0+PE5ndW9pQ2FwPlZOUFQgSVQ8L05ndW9pQ2FwPjxEb25WaUR1b2NDYXA+KjwvRG9uVmlEdW9jQ2FwPjxOZ2F5QmF0RGF1PjA4LzA2LzIwMjQgMDA6MDA6MDA8L05nYXlCYXREYXU+PE5nYXlLZXRUaHVjPjExLzA2LzIwMjQgMjM6NTk6NTk8L05nYXlLZXRUaHVjPjxNYWNPUz4xPC9NYWNPUz48U2lnbmF0dXJlIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwLzA5L3htbGRzaWcjIj48U2lnbmVkSW5mbz48Q2Fub25pY2FsaXphdGlvbk1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnL1RSLzIwMDEvUkVDLXhtbC1jMTRuLTIwMDEwMzE1IiAvPjxTaWduYXR1cmVNZXRob2QgQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwLzA5L3htbGRzaWcjcnNhLXNoYTEiIC8+PFJlZmVyZW5jZSBVUkk9IiI+PFRyYW5zZm9ybXM+PFRyYW5zZm9ybSBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNlbnZlbG9wZWQtc2lnbmF0dXJlIiAvPjwvVHJhbnNmb3Jtcz48RGlnZXN0TWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMC8wOS94bWxkc2lnI3NoYTEiIC8+PERpZ2VzdFZhbHVlPmFiVFVHTVBFajNLQTFZUWE2WnZYVGdvbEI1dz08L0RpZ2VzdFZhbHVlPjwvUmVmZXJlbmNlPjwvU2lnbmVkSW5mbz48U2lnbmF0dXJlVmFsdWU+QWNrU25IT0F6My9kc0tURVlDUlV1ZGhwTHRRTTlkS3hQazJHOUhkaE5SekpIaGpGeVA2L3puQVlsWWpWUFdBYzFvcmZSbWpYSGVzZmpUYTVad2dZcEt1YzdFZnEvZ0FCQXNVWTdUWHRObE1QWW8zYmw0R1FEb0hMVUJDZCtoaDZQbS9NNi9BZmdtZUd4T0RLZC9xNTBOT1hXbFhhd1ZwWStmWnd4ako4NXZEa0RJWS9DR255UlFkZHM4VjNjdXluMkJQaE5QYjN0UmNFREpMa0NpTHJWaDZXMnRCeWYrOHJpSW5FK3k5RThraGI0d2pGSzY1ZDhtWGdZTC9MNGY1VFpnczg0UFcwb0liTzdqMGtsK0Qza3gyZGtYdkdPUWpGZU50YlBxbWN6UmhHajdkcHMrelVVVVl1YkhWLzhhUWQ2T3RIY1h5bVlORWxyajI3U2ZSRTN3PT08L1NpZ25hdHVyZVZhbHVlPjxLZXlJbmZvPjxLZXlWYWx1ZT48UlNBS2V5VmFsdWU+PE1vZHVsdXM+cDI4Y1VUbm9YRzlVbzc1NHBqd2RaR0g4bVg0VlpRa0F5a29xaHNBcHZnWVB5VVFFa0JFNmQ5cXNaTDM2R3YxakZaMXZLaG9uSTZmTEV4VnJiSERtOStEZUtlelZJWnFRdkxpczYzZzNocm16UnQrYy9vQXphNk9ScWVCVlZtUGhDWE93L0pEcnd4SDNDTFpybFIxWEd4bXNxbGppNytWTTBwQy9DSWtpZy81dEZ1L1BDdVRjVFkvTmYveWZtTVQ5N05peTlObkZOWDVjUXFERVk1bFNDRG9veTBocFNDbmNZUXN1TGNRSkFmWXp2enc5b29PakZqWU9Vdm1jZW1EQzEvMEVFOWRiV2xXZXRmblZOYjhzem9xc0xCckxBREIxQ2hTZm5sOW9RRnpHUVZhMFJpSjl4T3dQb0oyNWpRZFZpbUUxOHZUTVpXWnRtR05TMnIrK09RPT08L01vZHVsdXM+PEV4cG9uZW50PkFRQUI8L0V4cG9uZW50PjwvUlNBS2V5VmFsdWU+PC9LZXlWYWx1ZT48WDUwOURhdGE+PFg1MDlDZXJ0aWZpY2F0ZT5NSUlHUlRDQ0JDMmdBd0lCQWdJUVZBRWtqM3lYUkVJN3dLN0tSL2NIc2pBTkJna3Foa2lHOXcwQkFRVUZBREJwTVFzd0NRWURWUVFHRXdKV1RqRVRNQkVHQTFVRUNoTUtWazVRVkNCSGNtOTFjREVlTUJ3R0ExVUVDeE1WVms1UVZDMURRU0JVY25WemRDQk9aWFIzYjNKck1TVXdJd1lEVlFRREV4eFdUbEJVSUVObGNuUnBabWxqWVhScGIyNGdRWFYwYUc5eWFYUjVNQjRYRFRFM01ESXlOekE1TXpJd01Gb1hEVEU1TURJeU56SXhNekl3TUZvd2dZb3hDekFKQmdOVkJBWVRBbFpPTVJJd0VBWURWUVFJREFsSXc0QWdUdUc3bUVreEZUQVRCZ05WQkFjTURFUGh1cWQxSUVkcDRicWxlVEVzTUNvR0ExVUVBd3dqVms1UVZDQlRUMFpVVjBGU1JTQXRJRlpPVUZRZ1EwRWdMU0JVUlZOVUlGTkpSMDR4SWpBZ0Jnb0praWFKay9Jc1pBRUJEQkpOVTFRNk1UQXhOamcyT1Rjek9DMHdNVEl3Z2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLQW9JQkFRQ25ieHhST2VoY2IxU2p2bmltUEIxa1lmeVpmaFZsQ1FES1NpcUd3Q20rQmcvSlJBU1FFVHAzMnF4a3Zmb2EvV01Wblc4cUdpY2pwOHNURld0c2NPYjM0TjRwN05VaG1wQzh1S3pyZURlR3ViTkczNXorZ0ROcm81R3A0RlZXWStFSmM3RDhrT3ZERWZjSXRtdVZIVmNiR2F5cVdPTHY1VXpTa0w4SWlTS0QvbTBXNzg4SzVOeE5qODEvL0orWXhQM3MyTEwwMmNVMWZseENvTVJqbVZJSU9pakxTR2xJS2R4aEN5NHR4QWtCOWpPL1BEMmlnNk1XTmc1UytaeDZZTUxYL1FRVDExdGFWWjYxK2RVMXZ5ek9pcXdzR3NzQU1IVUtGSitlWDJoQVhNWkJWclJHSW4zRTdBK2duYm1OQjFXS1lUWHk5TXhsWm0yWVkxTGF2NzQ1QWdNQkFBR2pnZ0hGTUlJQndUQndCZ2dyQmdFRkJRY0JBUVJrTUdJd01nWUlLd1lCQlFVSE1BS0dKbWgwZEhBNkx5OXdkV0l1ZG01d2RDMWpZUzUyYmk5alpYSjBjeTkyYm5CMFkyRXVZMlZ5TUN3R0NDc0dBUVVGQnpBQmhpQm9kSFJ3T2k4dmIyTnpjQzUyYm5CMExXTmhMblp1TDNKbGMzQnZibVJsY2pBZEJnTlZIUTRFRmdRVWJINGh0RnNPYkxEMWswTm9DWGp5RlR2WkNRc3dEQVlEVlIwVEFRSC9CQUl3QURBZkJnTlZIU01FR0RBV2dCUUdhY0RWMVFLS0ZZMUdmZWw4NG1nS1ZheHFyekJvQmdOVkhTQUVZVEJmTUYwR0Rpc0dBUVFCZ2UwREFRRURBUUVDTUVzd0lnWUlLd1lCQlFVSEFnSXdGaDRVQUU4QVNRQkVBQzBBVUFCeUFDMEFNZ0F1QURBd0pRWUlLd1lCQlFVSEFnRVdHV2gwZEhBNkx5OXdkV0l1ZG01d2RDMWpZUzUyYmk5eWNHRXdNUVlEVlIwZkJDb3dLREFtb0NTZ0lvWWdhSFIwY0RvdkwyTnliQzUyYm5CMExXTmhMblp1TDNadWNIUmpZUzVqY213d0RnWURWUjBQQVFIL0JBUURBZ1R3TURRR0ExVWRKUVF0TUNzR0NDc0dBUVVGQndNQ0JnZ3JCZ0VGQlFjREJBWUtLd1lCQkFHQ053b0REQVlKS29aSWh2Y3ZBUUVGTUJ3R0ExVWRFUVFWTUJPQkVURmphSFZqZFhWQVoyMWhhV3d1WTI5dE1BMEdDU3FHU0liM0RRRUJCUVVBQTRJQ0FRQXlxaUpQdnZrQ01NRjNCQmlQWjNHbmVobnd2aHRtRFJKalpSUk5tYjUyMkx3OHlTcUlwbzU3Z1hJU25MZTNxV3lDMEdDV2FWcy9XSjZUSmczZkIxR2FIcDJ1Skc4aEdWMGc1TUpuZ2dBa1dJSEhia2hreVhsS2QveHh2RjdsQ1dzbGg3T0xvL0R3SnpQY0FRS2REbW9zRExrTHV0bGppcktnUDExOFhtVHBKZTljbmhUR1d4bVI0M1JYbzFwSzZNWkpTLzM1QTBhRWNVRndsa3lPSnBGdXorR3JqcTJxSzJZc1Rwdk5JbnczTFpEd1Jra1lqaG1KT0UrZnVrcWZwOFdGY0J0RUdxV0RhQmJtcWdadmNpdDlzK1JvaTNXZU9NeFVLcmkwZlNBS0RjdXhuZjRyeGlmUTBCYmFzOUhVbU5tNjVWRXNtK2Y1QjB2ZFNtNlM3WDhabzU0dVF0UmcvSGQxYUNQeTBBRmRmYUhpKzZhZHFyMlpxM3B0TUlTMTA3bENkcTI2S3lOM1JNeFl2aDVOWnNnODhKYzlJTmxHeEw1OFdEOUVCN016RmtXbW5HYjlKYzF1a0FFYVBaQTl2d1pXWlVBdHBXT0lkVHhObVV2c1pkbFZBOXZEYy9UbkpSYlVrMGFDd3ZxVldNYWpQUG96dDgvQ3Z6SHF3Y091Z2tGdWM3KzhNOVJGaStSdFpYQStrclROZ25US0pSSGQxNjNkV3N5M2ZweUZVOVBBY3lreVRLcUZmaWxGak5pRzg3WDBNWnJwNGxMUmNTdUZrZ0hZNnIvaUlrTHZGTTZESXJUSlN4RFAzYlhvOWpGbDlRT2FiU05mb1B4S200MXU1R3FwZUpYamxOTkFESStHTnRXUTZnM1oybXVZV3BTNTROVWRKTnJ5R1B5THhBPT08L1g1MDlDZXJ0aWZpY2F0ZT48L1g1MDlEYXRhPjwvS2V5SW5mbz48T2JqZWN0PjxTaWduYXR1cmVQcm9wZXJ0aWVzIHhtbG5zPSIiPjxTaWduYXR1cmVQcm9wZXJ0eSBJZD0iU2lnbmluZ1RpbWUiIFRhcmdldD0ic2lnbmF0dXJlUHJvcGVydGllcyI+PFNpZ25pbmdUaW1lPjIwMjQtMDgtMDZUMDg6MTQ6MThaPC9TaWduaW5nVGltZT48L1NpZ25hdHVyZVByb3BlcnR5PjwvU2lnbmF0dXJlUHJvcGVydGllcz48L09iamVjdD48L1NpZ25hdHVyZT48L0xpY2Vuc2U+";
    var returnPluginSignal = "SignalReturn:";
    var vnpt_plugin =
    {
        connect: function (port, data) {
            if (get_browser().name === "IE" || get_browser().name === "MSIE") {
                if (navigator.userAgent.indexOf("Windows NT 10.0") !== -1) {
                    if (webSocket == null || pluginStatus != 1) {
                        webSocket = new WebSocket("wss://localhost:" + port + "/plugin");
                        timer = setTimeout(function () {
                            var s = webSocket;
                            webSocket = null;
                            s.close();
                            currentID++;
                            vnpt_plugin.tryConnect();
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
                    }
                    // closed
                    webSocket.onclose = function () {
                        pluginStatus = 0;
                    }
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
                        //window[resSplit[1]](resSplit[0]);
                        if (resSplit[0].indexOf(returnPluginSignal) !== -1) // check plugin advanced
                        {
                            var sigHex = resSplit[0].substr(returnPluginSignal.length, resSplit[0].length - returnPluginSignal.length);
                            var validateRes = doVerify(pluginSignal, sigHex);
                            if (validateRes) {
                                window[resSplit[1]]("1");
                            }
                            else {
                                window[resSplit[1]]("-1");
                            }
                        }
                        else {
                            window[resSplit[1]](resSplit[0]);
                        }
                    }
                    // error
                    webSocket.onerror = function () {
                        pluginStatus = 0;
                    }
    
                }
                else {
                    //console.log("For IE < 11");
                    try {
                        iePlugin = new ActiveXObject("InternetExplorerModule.Main");
                        var pluginEvents = iePlugin.PluginEvents();
                        pluginEvents.ScriptCallbackObject = VnptInternetExplorerCallback;
                        iePlugin.Execute(data);
                    }
                    catch (Err) {
                        //console.log(Err.description);
                        var obj = JSON.parse(data);
                        if (obj.functionID === 7) {
                            //VnptInternetExplorerCallback("-1");
                            window[obj.funcCallback]("-1");
                        }
                    }
                }
            }
            else {
                return new Promise(function (success, reject) {
                    if (currentID == 0) {
                        checkPluginRejectCallback = success;
                    }
                    if (webSocket == null || pluginStatus != 1) {
                        try {
                            webSocket = new WebSocket("wss://localhost:" + port + "/plugin");
                            timer = setTimeout(function () {
                                var s = webSocket;
                                webSocket = null;
                                s.close();
                                currentID++;
                                vnpt_plugin.tryConnect(data, success, reject);
                            }, timeOut);
                        } catch (e) {
                            console.log(e);
                            vnptCheckPluginCallback("-1")
                        }
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
                    }
                    // closed
                    webSocket.onclose = function () {
                        pluginStatus = 0;
                    }
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
                            if (resSplit[0].indexOf(returnPluginSignal) !== -1) // check plugin advanced
                            {
                                var sigHex = resSplit[0].substr(returnPluginSignal.length, resSplit[0].length - returnPluginSignal.length);
                                var validateRes = doVerify(pluginSignal, sigHex);
                                if (validateRes) {
                                    success("1");
                                }
                                else {
                                    success("-1");
                                }
                            }
                            else {
                                success(resSplit[0]);
                            }
                        }
                        else {
                            if (resSplit[0].indexOf(returnPluginSignal) !== -1) // check plugin advanced
                            {
                                var sigHex = resSplit[0].substr(returnPluginSignal.length, resSplit[0].length - returnPluginSignal.length);
                                var validateRes = doVerify(pluginSignal, sigHex);
                                if (validateRes) {
                                    window[resSplit[1]]("1");
                                }
                                else {
                                    window[resSplit[1]]("-1");
                                }
                            }
                            else {
                                window[resSplit[1]](resSplit[0]);
                            }
                        }
                    }
                    // error
                    webSocket.onerror = function () {
                        //console.log("Error");
                        pluginStatus = 0;
                        //reject("Catch Error");
                        if (currentID === 2) {
                            if (vnptCheckPluginCallback == null) {
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
                // this.connect(ports[currentID], data).then(function (data) {
                // //defaultPort = currentID;
                // success(data);
                // }).catch(function (e) {
                // currentID = 0;
                // reject(e);
                // });
                if (get_browser().name === "IE" || get_browser().name === "MSIE") {
                    this.connect(ports[currentID], data);
                }
                else {
                    this.connect(ports[currentID], data).then(function (data) {
                        //defaultPort = currentID;
                        success(data);
                    });
                }
            }
            else {
                //console.log("Can not connect plugin");
                currentID = 0
                if (get_browser().name === "IE" || get_browser().name === "MSIE") {
                    vnptCheckPluginCallback("-1");
                }
                else {
                    checkPluginRejectCallback("-1");
                }
    
                //success("-1");
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
        getCertInfo: function (funcCallback, isOnyFromToken, serialNumber) {
            var callInfo = {};
            callInfo.functionID = functionId.GetCertInfo;
            if (funcCallback != null) {
                if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true))
                    callInfo.funcCallback = funcCallback.toString().match(/^function\s*([^\s(]+)/)[1];
                else
                    callInfo.funcCallback = funcCallback.name;
            }
            else {
                callInfo.funcCallback = "callbackDefault";
            }
            var isOnyToken = "0";
            if (isOnyFromToken !== null && isOnyFromToken)
                isOnyToken = "1";
            var args = [
                isOnyToken,
                serialNumber
            ];
            callInfo.args = args;
            return this.sendMessageToPlugin(callInfo);
        },
        setLicenseKey: function (license, funcCallback) {
            var callInfo = {};
            callInfo.functionID = functionId.setLicenseKey;
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
        checkPlugin: function (funcCallback) {
            vnptCheckPluginCallback = funcCallback;
    
            checkPluginCall = 1;
            timeOut = 3000;
    
            var callInfo = {};
            callInfo.functionID = functionId.checkPlugin;
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
        signArrDataAdvanced: function (arrData, serial, clearPINCache, funcCallback, showCertList) {
            var callInfo = {};
            var clearPIN = "0";
            if (clearPINCache != null && clearPINCache)
                clearPIN = "1";
            var isShowCertList = "1";
            if (showCertList != null && !showCertList)
                isShowCertList = "0";
    
            var jsArr = JSON.stringify(arrData);
            callInfo.functionID = functionId.signArrDataAdvanced;
    
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
                jsArr,
                serial,
                clearPIN,
                isShowCertList
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
        }
    }
    
    function GetCertInfo() {
        vnpt_plugin.setLicenseKey(pluginLicenseKey).then(function (data) {
            vnpt_plugin.getCertInfo().then(function (data) {
                console.log(data);
                if (data === "" || data === null) {
                    DevExpress.ui.notify("Không lấy được thông tin chứng thư số", "error", 5000);
                    return;
                }
                var jsOb = JSON.parse(data);
                if (jsOb !== "" || jsOb != null) {
                    document.getElementById('serial').value = jsOb.serial;
                    document.getElementById('base64Cert').value = jsOb.base64;
                }
            }).catch(function (e) {
                alert(e);
            });
        }).catch(function (e) {
            console.log(e)
        });
    
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
    
    function checkPlugin() {
        vnpt_plugin.checkPlugin().then(function (data) {
            if (data === "1") {
                alert("Plugin đã sẵn sàng")
                clearTimeout(timer); // clear 
                vnpt_plugin.setLicenseKey(pluginLicenseKey).then(function (data) {
                    console.log(data);
                }).catch(function (e) {
                    console.log(e)
                });
            }
            else {
                timer = setTimeout(checkPlugin, 1500);
            }
        }).catch(function (e) {
            //alert("VNPT-CA Plugin chưa được cài đặt hoặc chưa được bật");
    
        });
    
    }
    
    return {
        vnpt_plugin: vnpt_plugin,
        pluginLicenseKey: pluginLicenseKey  // Trả về functionId để có thể gọi từ bên ngoài
    };
}));

