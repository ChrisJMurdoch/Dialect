
// From: https://stackoverflow.com/a/28458409
function escapeHTML(unsafe) {
    return unsafe.replace(/[&<"']/g, (c) => {
        switch (c) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '"': return '&quot;';
        default: return '&#039;';
        }
    });
}

function matchCase(toMatch, toChange) {
    return ( (/[A-Z]/).test(toMatch.charAt(0)) ? toChange.charAt(0).toUpperCase() : toChange.charAt(0).toLowerCase() ) + toChange.slice(1);
}

function getSwapword(word) {
    
    const lowercaseWord = word.toLowerCase();

    const usWord = ukToUs.get(lowercaseWord);
    if (usWord!==undefined)
        return [matchCase(word, usWord), "us"];

    const ukWord = usToUk.get(lowercaseWord);
    if (ukWord!==undefined)
        return [matchCase(word, ukWord), "uk"];
    
    return null;
}

function processWord(word, id) {

    const swapword = getSwapword(word);
    return swapword===null ? word : `<div id="${id}" class="swappable ${swapword[1]==="uk" ? "us" : "uk"}">${word}</div>`;
}

function scan() {

    // Get text from front and split into characters
    const front = document.getElementById('front');
    const characters = Array.from(escapeHTML(front.value));

    // Generate back text
    let output = "";
    if (characters.length > 0) {

        // Iterate text and identify recognised words
        let id=0, word="";
        const alphabeticRegex = /[a-zA-Z]/;    
        let alphabetic = alphabeticRegex.test(characters[0]); 
        for (letter of characters) {
            if (alphabetic) {
                alphabetic=alphabeticRegex.test(letter);
                if (alphabetic) {
                    word += letter;
                } else {
                    output += processWord(word, "swappable_"+id++);
                    word = letter;
                }
            } else {
                alphabetic=alphabeticRegex.test(letter);
                if (alphabetic) {
                    output += word;
                    word = letter;
                } else {
                    word += letter;
                }
            }
        }
        output += alphabetic ? processWord(word, "swappable_"+id++) : word;
    }

    // Set back element
    back.innerHTML = output;
}

function syncHovertags() {

    // Get required ids
    const swappableIds = new Set( Array.from( document.getElementsByClassName("swappable") ).map(e => e.id) );
    let hovertagIds = new Set( Array.from( document.getElementsByClassName("hovertag") ).map(e => e.id) );
    
    // Remove old hovertags
    for (const hovertagId of hovertagIds)
        if (!swappableIds.has(hovertagId.replace("hovertag", "swappable")))
            document.getElementById(hovertagId).remove();
    
    // Add new hovertags
    const editor = document.getElementById('editor');
    for (const swappableId of swappableIds) {
        const hovertagId = swappableId.replace("swappable", "hovertag");
        if (!hovertagIds.has(hovertagId)) {

            const hovertag = document.createElement("div");
            editor.appendChild(hovertag);
            hovertag.setAttribute("class", "hovertag");
            hovertag.setAttribute("id", hovertagId);
            hovertag.setAttribute("onclick", "swap(this.id)");

            const hovertagInner = document.createElement("div");
            hovertag.appendChild(hovertagInner);
            hovertagInner.setAttribute("class", "inner");
            hovertagInner.innerText = getSwapword(document.getElementById(swappableId).innerText)[0];
        }
    }

    // Update hovertag set
    hovertagIds = new Set( Array.from( document.getElementsByClassName("hovertag") ).map(e => e.id) );

    // Sync values
    for (hovertagId of hovertagIds) {

        const hovertag = document.getElementById(hovertagId);
        const swappable = document.getElementById(hovertagId.replace("hovertag", "swappable"));
        const swappableBounds = swappable.getBoundingClientRect();

        const optionalSet = (obj, field, value) => { if (obj[field]!==value) obj[field]=value; }

        optionalSet(hovertag.style, "top", window.scrollY+swappableBounds.bottom+"px");
        optionalSet(hovertag.style, "left", window.scrollX+swappableBounds.left + (swappableBounds.width-hovertag.getBoundingClientRect().width) / 2 + "px");
        optionalSet(hovertag.firstChild, "innerText", getSwapword(swappable.innerText)[0]);
    }
}

function swap(hovertagId) {

    const hovertagInner = document.getElementById(hovertagId).firstChild;
    const swapppable = document.getElementById(hovertagId.replace("hovertag", "swappable"));

    const swappableSwapword = getSwapword(swapppable.innerText)
    swapppable.innerText = swappableSwapword[0];
    swapppable.classList.replace(swappableSwapword[1]==="uk" ? "us" : "uk", swappableSwapword[1]);
    hovertagInner.innerText = getSwapword(hovertagInner.innerText)[0];

    // Only time where front text is set - No caret because button has been clicked
    document.getElementById('front').value = document.getElementById('back').innerText;
}

function convertAll(dest) {

    for (hovertagId of Array.from( document.getElementsByClassName("hovertag") ).map(e => e.id))
        if (getSwapword(document.getElementById(hovertagId).firstChild.innerText)[1] !== dest)
            swap(hovertagId);
}

function loop() {

    // Set front size based on autosizing back
    document.getElementById("front").style.height = document.getElementById("back").offsetHeight+100+"px";

    syncHovertags();

    setTimeout(loop, 10);
}

function onload() {

    // Parse GET parameters
    const params = new URLSearchParams(window.location.search);

    // Set default text
    if (params.get("text") === "demo")
        document.getElementById("front").value = `American usage, in most cases, keeps the u in the word glamour, which comes from Scots, not Latin or French.  Glamor is sometimes used in imitation of the spelling reform of other -our words to -or.  Nevertheless, the adjective glamorous often drops the first "u".  Saviour is a somewhat common variant of savior in the US. The British spelling is very common for honour (and favour) in the formal language of wedding invitations in the US.  The name of the Space Shuttle Endeavour has a u in it because the spacecraft was named after British Captain James Cook's ship, HMS Endeavour.  The (former) special car on Amtrak's Coast Starlight train is known as the Pacific Parlour car, not Pacific Parlor.  Proper names such as Pearl Harbor or Sydney Harbour are usually spelled according to their native-variety spelling vocabulary.`;
    else if (params.get("text") !== null)
        document.getElementById("front").value = params.get("text");

    // Set up listener
    document.getElementById("front").addEventListener('input', scan);

    // Run first scan manually
    scan();

    // Repeatedly sync elements
    loop();
}
