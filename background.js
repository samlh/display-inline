function guessContentType(fileName) {
    return {
        png: "image/png",
        gif: "image/gif",
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        webp: "image/webp",
        pdf: "application/pdf",
        txt: "text/plain",
        diff: "text/plain",
        patch: "text/plain",
        torrent: "text/plain",
        mp3: "audio/mpeg",
        json: "application/json"
    }[fileName.split('.').pop()];
}
function isBlacklistedContentType(contentType) {
    return /^application\/octet-?stream$/i.test(contentType);
}
browser.webRequest.onHeadersReceived.addListener(
    function (request) {
        let contentTypeHeader, contentDispositionHeader;
        for (let header of request.responseHeaders) {
            switch (header.name.toLowerCase()) {
                case "content-type":
                    contentTypeHeader = header;
                    break;
                case "content-disposition":
                    contentDispositionHeader = header;
                    break;
            }
        }
        let contentType;
        if (contentTypeHeader && !isBlacklistedContentType(contentTypeHeader.value))
            contentType = contentTypeHeader.value;
        if (contentDispositionHeader) {
            let sections = contentDispositionHeader.value.split(";");
            if (sections[0].trim() == "attachment")
                contentDispositionHeader.value = contentDispositionHeader.value.replace(/^\s*attachment/, "inline");
            if (!contentType) {
                for (let section of sections) {
                    var parts = section.split("=", 2);
                    var key = parts[0].trim();
                    if (key == "filename" || key == "filename*") {
                        var value = parts[1].trim();
                        if (value.endsWith("\""))
                            value = value.slice(0, -1);
                        contentType = guessContentType(value);
                        if (contentType)
                            break;
                    }
                }
            }
        }
        if (!contentType)
            contentType = guessContentType(request.url);
        if (contentType) {
            if (contentTypeHeader)
                contentTypeHeader.value = contentType;
            else
                request.responseHeaders.push({ name: "Content-Type", value: contentType });
        }
        return {
            responseHeaders: request.responseHeaders
        }
    },
    {
        urls: ["<all_urls>"],
        types: ["main_frame", "sub_frame"]
    },
    ["blocking", "responseHeaders"]);
