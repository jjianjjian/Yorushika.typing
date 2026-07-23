(() => {

const app = document.querySelector("#app");
const data = window.DATA_MANIFEST || {};


const state = {
    lang: "korean",
    item: null,
    target: "",
    started: 0,
    timer: null,
    finished: false,
    composing: false,
    maxTyped: 0
};


const norm = s =>
    String(s || "")
    .replace(/\r\n/g,"\n")
    .trim();


const esc = s =>
    String(s)
    .replace(/[&<>]/g,c=>({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;"
    }[c]));



const formatTime = sec =>
    `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`;



function nav(){

return `
<div class="nav">
${["korean","english","japanese"]
.map(x=>`

<button data-lang="${x}"
class="${x===state.lang?"active":""}">

${x==="korean"?"한국어":
x==="english"?"English":"日本語"}

</button>

`).join("")}
</div>
`;

}



function bindNav(){

app.querySelectorAll("[data-lang]")
.forEach(btn=>{

btn.onclick=()=>{

state.lang=btn.dataset.lang;

menu();

};

});

}



function menu(){

const set =
data[state.lang] ||
{
    works:[],
    shortPool:[]
};



app.innerHTML =
nav()
+
`

<section class="panel">

<h1>
${state.lang==="korean"
?"한국어"
:
state.lang==="english"
?"English"
:"日本語"}
연습
</h1>


<button id="random">
무작위 문장
</button>


<div class="list">

${set.works.map((w,i)=>`

<button data-work="${i}">

${esc(w.title||"제목 없음")}

<span class="meta">
${esc(w.author||"")}
</span>

</button>

`).join("")}

</div>


</section>

`;



bindNav();



app.querySelector("#random").onclick =
()=>start(
set.shortPool[
Math.floor(Math.random()*set.shortPool.length)
]
);



app.querySelectorAll("[data-work]")
.forEach(btn=>{

btn.onclick =
()=>start(
set.works[
Number(btn.dataset.work)
]
);

});

}




function start(item){

state.item=item;
state.finished=false;
state.started=0;
state.maxTyped=0;


clearInterval(state.timer);


state.target =
norm(
state.lang==="japanese"
?
(item.reading||item.text)
:
(item.content||item.text)
);



app.innerHTML =
nav()
+
`

<section class="panel">

<h2>
${esc(item.title||"연습")}
</h2>


<div class="stats">

<span>
진행률
<b id="progress">0%</b>
</span>

<span>
정확도
<b id="accuracy">100%</b>
</span>

<span>
CPM
<b id="cpm">0</b>
</span>

<span>
시간
<b id="time">0:00</b>
</span>

</div>


<div class="bar">
<i id="fill"></i>
</div>


<div id="stage" class="stage">

<div id="text"></div>

<textarea id="capture"
class="capture"
autocomplete="off"
spellcheck="false"></textarea>

</div>


<button id="restart">
다시하기
</button>


<button id="exit">
종료
</button>


</section>

`;



bindNav();


const input =
app.querySelector("#capture");


const text =
app.querySelector("#text");
function insertText(value){

    const start = input.selectionStart;
    const end = input.selectionEnd;

    input.value =
        input.value.slice(0,start)
        +
        value
        +
        input.value.slice(end);


    const cursor =
        start + value.length;


    input.selectionStart =
    input.selectionEnd =
        cursor;


    input.dispatchEvent(
        new Event("input",{
            bubbles:true
        })
    );

}



function evaluate(){

    const typed = input.value;


    if(state.lang==="korean"){

        return Hangul.evaluate(
            state.target,
            typed
        );

    }



    let correct = 0;


    for(
        let i=0;
        i<typed.length;
        i++
    ){

        if(
            typed[i] === state.target[i]
        ){

            correct++;

        }

    }



    return {

        correctJamoCount: correct,

        wrongJamoCount:
            typed.length - correct,

        done:
            typed === state.target

    };

}



function skipEmptyLines(){

    let pos =
        input.value.length;


    while(
        state.target[pos] === "\n"
    ){

        function skipEmptyLines(){

    let pos=input.value.length;


    while(
        state.target[pos]==="\n"
    ){

        pos++;

    }


    if(pos !== input.value.length){

        input.value =
            input.value +
            state.target.slice(
                input.value.length,
                pos
            );

    }

}

        pos++;

    }

}



function render(){

    const typed =
        input.value;


let cursor = typed.length;


while(
    state.target[cursor]==="\n"
){

    cursor++;

}


const display =
typed +
state.target.slice(cursor);


    const result =
        evaluate();



    const frag =
        document.createDocumentFragment();



    for(
        let i=0;
        i<display.length;
        i++
    ){



        if(display[i]==="\n"){

            frag.appendChild(
                document.createElement("br")
            );

            continue;

        }



        const span =
            document.createElement("span");


        span.textContent =
            display[i];


        span.className =
            "ch";



        if(i < typed.length){


            if(state.lang==="korean"){

                span.classList.add(
                    result.charStatus?.[i]
                    ||
                    "wrong"
                );

            }
            else{

                span.classList.add(
                    typed[i]===state.target[i]
                    ?
                    "correct"
                    :
                    "wrong"
                );

            }


        }
        else if(i===typed.length){


            span.classList.add(
                "current",
                "pending"
            );


        }
        else{


            span.classList.add(
                "pending"
            );


        }



        frag.appendChild(span);

    }



    text.replaceChildren(frag);



    const progress =
        Math.min(
            typed.length /
            Math.max(state.target.length,1),
            1
        ) * 100;



    app.querySelector("#fill")
        .style.width =
        `${progress}%`;



    app.querySelector("#progress")
        .textContent =
        `${Math.round(progress)}%`;
const current =
text.querySelector(".current");


if(current){

    current.scrollIntoView({
        behavior:"smooth",
        block:"center"
    });

}


    return result;

}
id="part3"

function tick(){

    if(!state.started)
        return;


    const sec =
        (Date.now()-state.started)/1000;


    const result =
        evaluate();



    const cpm =
        result.correctJamoCount /
        Math.max(sec/60,0.01);



    app.querySelector("#cpm")
        .textContent =
        Math.round(cpm);



    app.querySelector("#time")
        .textContent =
        formatTime(sec);

}



function done(){

    if(state.finished)
        return;


    state.finished = true;


    clearInterval(state.timer);


    input.blur();



    app.querySelector("#stage")
        .insertAdjacentHTML(
            "beforeend",
            `
            <p class="meta">
            완료되었습니다.
            </p>
            `
        );

}





input.addEventListener(
"input",
e=>{


    if(!state.started){

        state.started =
            Date.now();


        state.timer =
            setInterval(
                tick,
                500
            );

    }



    skipEmptyLines();



    state.maxTyped =
        Math.max(
            state.maxTyped,
            input.value.length
        );



    const result =
        render();
        const current =
text.querySelector(".current");

if(current){

    current.scrollIntoView({
        behavior:"smooth",
        block:"center"
    });

}



    const accuracy =
        (
            state.maxTyped -
            result.wrongJamoCount
        )
        /
        Math.max(
            state.maxTyped,
            1
        )
        *
        100;



    app.querySelector("#accuracy")
        .textContent =
        `${Math.max(
            0,
            Math.round(accuracy)
        )}%`;




    const finished =
        state.lang==="korean"
        ?
        result.done
        :
        input.value===state.target;



    if(
        !e.isComposing &&
        !state.composing &&
        finished
    ){

        done();

    }


});





input.addEventListener(
"keydown",
e=>{


    if(
        e.code!=="Space" ||
        state.composing
    )
        return;



    const pos =
        input.selectionStart;



    if(
        state.target[pos]==="\n"
    ){

        e.preventDefault();



        let count = 0;



        while(
            state.target[pos+count]==="\n"
        ){

            count++;

        }



        insertText(
            "\n".repeat(count)
        );

    }


});





input.addEventListener(
"compositionstart",
()=>{

    state.composing=true;

});



input.addEventListener(
"compositionend",
()=>{

    state.composing=false;

    render();

});

app.querySelector("#stage")
.onclick = () => {

    input.focus();

};



app.querySelector("#restart")
.onclick = () => {

    start(state.item);

};



app.querySelector("#exit")
.onclick = () => {

    menu();

};



window.addEventListener(
"keydown",
e=>{

    if(e.key==="Escape"){

        menu();

    }

});



render();


input.focus();


}



menu();



})();