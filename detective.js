
var lastSpot = 0;

var sergeantMode = true;

var actualLocation = 0;

var cdMin = 0, cdMax = 0;

var carSpeed = 3;

var siren;

var searchTimes = 0;

var sceneSrcs = [ "cityscene.svg", "city-park.svg", "forest-scene.svg" ];

var curScene = -1; /* incremented by first call to nextScene */

var currentPrecision = 1; /* divided by first call to nextScene */

var lastMin = 0;

var startCdMin = 0, startCdMax = 0;

var rnd = new MersenneTwister();

function moveCarTo(current, target, callback) {
    if(current > target) {
        if(!$("#test-circle")[0].classList.contains("flipImg"))
            $("#test-circle")[0].classList.add("flipImg");
    } else
        $("#test-circle")[0].classList.remove("flipImg");
    $("#test-circle").css({ left: current });
    lastSpot = current;
    /*
    $("#test-circle")[0].scrollIntoView({
        behavior: "auto",
        inline: "center"
    }); */
    scrollIntoView($("#test-circle")[0], {
        validTarget: function(target, parentsScrolled){

            // Only scroll the first two elements that don't have the class "dontScroll"
            // Element.matches is not supported in IE11, consider using Element.prototype.msMatchesSelector if you need to support that browser

            return true; //parentsScrolled < 2 && target !== window && !target.matches('.dontScroll');
        },
        isScrollable: function(target, defaultIsScrollable){

            // By default scroll-into-view will only attempt to scroll elements that have overflow not set to `"hidden"` and who's scroll width/height is larger than their client height.
            // You can override this check by passing an `isScrollable` function to settings:

            return defaultIsScrollable(target) || !target.classList.contains('dontScroll');
        }
    });
    var speed = carSpeed;
    if(Math.abs(current - target) < speed)
        speed = Math.abs(current - target);
    if(current < target)
        setTimeout(function() {
            moveCarTo(current + speed, target, callback);
        }, 25);
    else if(current > target) {
        setTimeout(function() {
            moveCarTo(current - speed, target, callback);
        }, 25);
    }
    if(current === target) {
        if(callback)
            callback();
    }
}

function generateStreetAddress(address) {
    var container = document.createElement("div");
    container.classList.add("nl-part-cont");
    var img = document.createElement("img");
    img.classList.add("nl-part");
    img.src = "nl-part.svg";
    img.style.left = address + "px";
    container.appendChild(img);
    $("#number-bar")[0].appendChild(container);
    var text = document.createElement("p");
    text.classList.add("nl-part-text");
    text.style.left = (address+30) + "px";
    
    text.innerHTML = adjustForPrecision(lastMin + ((address/96) * currentPrecision));
    container.appendChild(text);
}

function invalid() {
    $("#invalidDialog").dialog({
        modal: true,
        dialogClass: 'noTitle'
    });
}
function goToAddress(num, callback) {
    if(num > startCdMax || num < startCdMin || num === undefined) {
        $("#search-now").prop('disabled', false); /* re-enable Go button */
        invalid();
        return;
    }
    console.log("cdMin " + cdMin + " num " + num + " cdMax " + cdMax);
    if(num >= cdMax || num <= cdMin) {
        checkedAlready();
        return;
    }
    playSiren();
    var s = num.toString();
    moveCarTo(lastSpot, parseInt(s[s.length - 1]) * 100, callback);
}
function randomInt(min,max) // min and max included
{
    console.log(min + " " + max);
    return Math.floor(rnd.random()*(max-min+1)+min);
}
Number.prototype.toFixedNumber = function(x, base){
  var pow = Math.pow(base||10,x);
  return Math.round(this*pow) / pow;
}
function adjustForPrecision(x) {
    if(x === undefined)
        return undefined;
    return x.toFixedNumber(Math.log10(1 / currentPrecision));
}

function regenerate() {
    playSiren(false);
    moveCarTo(0, 0);
    searchTimes = 0;
    $("#search-times").text(searchTimes);
    console.log("lastMin " + lastMin);
    console.log("currentPrecision " + currentPrecision);
    cdMin = lastMin;
    startCdMin = cdMin;
    $("#cd-min").text(cdMin.toFixed(Math.log10(1 / currentPrecision)));
    cdMax = adjustForPrecision((lastMin + (currentPrecision * 10)));
    startCdMax = cdMax;
    $("#cd-max").text(cdMax.toFixed(Math.log10(1 / currentPrecision)));
    
    actualLocation =  adjustForPrecision((randomInt(1, 9) * currentPrecision) + cdMin);
}

function notDecimal() {
    $("#notDecimal").dialog({
        modal: true,
        width: 'auto',
        height: 'auto',
        dialogClass: 'noTitle'
    });
    $('#notDecimal').css('overflow', 'hidden');
}
function checkedAlready() {
    $("#checkedAlready").dialog({
        modal: true,
        width: 'auto',
        height: 'auto',
        dialogClass: 'noTitle'
    });
    $('#checkedAlready').css('overflow', 'hidden');
    $("#search-now").prop('disabled', false); /* re-enable Go button */
}
function caughtDecimal() {
    $("#caughtDecimal").dialog({
        modal: true,
        width: 'auto',
        height: $(window).height() * 0.9
    });
    $('#caughtDecimal').css('overflow', 'hidden');
}

function playAgain() {
    $("#playAgainDialog").dialog({
        modal: true
    });
}

function continueGame() {
    console.log("continue");
    if(sergeantMode) {
        console.log("curScene " + curScene);
        if((curScene + 1) !== sceneSrcs.length) {
            nextScene();
        } else {
            playAgain();
        }
    } else {
        console.log("Regenerate");
        searchTimes = 0;
        regenerate();
    }
}

function gotAway() {
    $("#gotAwayDialog").dialog({
        modal: true,
        width: 'auto',
        height: 'auto',
        dialogClass: 'noTitle'
    });
}

function playSiren(doPlay) {
    siren.currentTime = 0;
    if(doPlay === undefined || doPlay)
        siren.play();
    else
        siren.pause();
}

function nextScene() {
    curScene++;
    $("#city-image").attr("src", sceneSrcs[curScene]);
   
    lastMin = actualLocation;
    currentPrecision /= 10; /* Get deeper into the decimals */
    $("#number-bar").empty();
    for(var i = 0; i < 10; i++) {
        generateStreetAddress(i*96);
    }
    regenerate();
}

$(function() {
    siren = new Audio("siren.mp3");
    $("#startDialog").dialog({
        modal: true,
        width: 'auto',
        height: 'auto',
        dialogClass: 'noTitle'
    });
    $("#cd-direction").text("left");
    nextScene();
    $("#search-now").click(function() {
        $("#search-now").prop('disabled', true); /* disable Go button */
        searchTimes++;
        $("#search-times").text(searchTimes);
        var str = $("#decimal-number").val();
        var num = adjustForPrecision(parseFloat(str));
        goToAddress(num, function() {
            console.log("num " + num + " actualLocation " + actualLocation);
            /* Put up the appropriate dialog based on whether we caught him or not. */
            if(num < actualLocation) {
                cdMin = num;
                $("#cd-min").text(cdMin);
                $("#cd-direction").text("right");
                notDecimal();
                playSiren(false);
            } else if(num > actualLocation) {
                $("#cd-direction").text("left");
                cdMax = num;
                $("#cd-max").text(cdMax);
                notDecimal();
                playSiren(false);
            } else {
                if(!sergeantMode)
                    caughtDecimal();
                else {
                    if(curScene === 2)
                        caughtDecimal(); /* last scene, game ends */
                    else
                        gotAway(); /* next precision level */
                }
            }
            $("#search-now").prop('disabled', false); /* re-enable Go button */
        });
    });
});
