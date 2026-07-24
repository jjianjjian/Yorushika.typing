(() => {

const app = document.querySelector("#app");
const data = window.DATA_MANIFEST || {};

let lang = "korean";
let item = null;

let timer = null;
let started = 0;
let finished = false;


const norm = s =>
    String(s || "")
    .replace(/\r\n/g,"\n")
    .trim();


const esc = s =>
    String(s).replace(/[&<>]/g,c=>({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;"
    }[c]));



const nav = () => `
<div class="nav">
<div class="langs">
${["korean","english","japanese"].map(x=>`
<button data-lang="${x}" class="${x===lang?"active":""}">
${x==="korean"?"한국어":x==="english"?"English":"日本語"}
</button>
`).join("")}
</div>
</div>
`;



function bindNav(){

app.querySelectorAll("[data-lang]")
.forEach(btn=>{

btn.onclick=()=>{

lang=btn.dataset.lang;
menu();

};

});

}



function home(){

app.innerHTML=`

${nav()}

<section class="panel">

<h1>타자 연습</h1>

<p class="meta">
언어를 선택해 문장 연습을 시작하세요.
</p>

</section>

`;

bindNav();

}




function menu(){

const set=data[lang] || {
works:[],
shortPool:[]
};



app.innerHTML=`

${nav()}

<section class="panel">

<h1>
${lang==="korean"
?"한국어"
:lang==="english"
?"English"
:"日本語"} 연습
</h1>


<div class="list">

<button id="random">
무작위 문장
</button>


${set.works.map((w,i)=>`

<button data-work="${i}">
${esc(w.title || "제목 없음")}
<span class="meta">
${esc(w.author || "")}
</span>
</button>

`).join("")}

</div>

</section>

`;



bindNav();



app.querySelector("#random").onclick=()=>{

if(set.shortPool.length){

start(
set.shortPool[
Math.floor(Math.random()*set.shortPool.length)
]
);

}

};



app.querySelectorAll("[data-work]")
.forEach(btn=>{

btn.onclick=()=>{

start(
set.works[
Number(btn.dataset.work)
]
);

};

});

}






function start(next){

item=next;

finished=false;

started=0;

clearInterval(timer);



const raw =
lang==="japanese"
?
(item.reading || item.text)
:
(item.content || item.text);



const lines=norm(raw).split("\n");

let lineIndex=0;

let inputValue="";



app.innerHTML=`

${nav()}


<section class="panel">


<h2>${esc(item.title || "무작위 문장")}</h2>


<div class="stats">

<span>
진행률 <b id="progress">0%</b>
</span>

<span>
정확도 <b id="accuracy">100%</b>
</span>

<span>
CPM <b id="cpm">0</b>
</span>

<span>
시간 <b id="time">0:00</b>
</span>

</div>


<div class="bar">
<i id="fill"></i>
</div>


<div class="stage" id="stage"></div>


<div class="actions">

<button id="restart">
다시하기
</button>

<button id="exit">
종료
</button>

</div>


</section>

`;



bindNav();



const stage=app.querySelector("#stage");


const input=document.createElement("input");

input.className="capture";

input.autocomplete="off";

input.spellcheck=false;

let composing = false;


input.addEventListener("input",()=>{

    inputValue=input.value;


    if(!started){

        started=Date.now();

        timer=setInterval(updateTime,500);

    }


    if(!composing){

        render();

        if(input.value===lines[lineIndex]){

            nextLine();

        }

    }

});

input.addEventListener("compositionstart",()=>{

    composing=true;

});



input.addEventListener("compositionend",()=>{

    composing=false;


    if(input.value===lines[lineIndex]){

        nextLine();

    }
    else{

        render();

    }

});



input.addEventListener("keydown",e=>{

    if(e.key==="Enter"){

        e.preventDefault();


        if(input.value===lines[lineIndex]){

            nextLine();

        }

    }

});



function render(){

    while(stage.firstChild){
    stage.removeChild(stage.firstChild);
}


    lines.forEach((line,index)=>{


        const row=document.createElement("div");

        row.className="line";



        if(index < lineIndex){


            row.classList.add("done");


            for(const c of line){


                const span=document.createElement("span");

                span.className="ch correct";

                span.textContent=c;

                row.appendChild(span);


            }


        }


        else if(index === lineIndex){


            const typed=input.value;


            for(let i=0;i<line.length;i++){


                const span=document.createElement("span");

                span.className="ch";


                span.textContent=line[i];



                if(i < typed.length){


                    if(lang==="korean"){


                        const result =
                        Hangul.evaluate(
                            line,
                            typed
                        );


                        span.classList.add(
                            result.charStatus[i] || "wrong"
                        );


                    }
                    else{


                        span.classList.add(
                            typed[i]===line[i]
                            ?
                            "correct"
                            :
                            "wrong"
                        );


                    }


                }
                else{

                    span.classList.add("pending");

                }


                row.appendChild(span);


            }



            row.appendChild(input);


        }


        else{


            row.classList.add("pending");


            for(const c of line){


                const span=document.createElement("span");

                span.className="ch pending";

                span.textContent=c;

                row.appendChild(span);


            }


        }



        stage.appendChild(row);


    });


    updateProgress();

input.focus();

}




function nextLine(){


    lineIndex++;


    input.value="";


    if(lineIndex>=lines.length){


        finish();

        return;

    }


    render();


}




function updateProgress(){


    let total=0;

    let done=0;



    lines.forEach((line,i)=>{


        total+=line.length;


        if(i < lineIndex){

            done+=line.length;

        }


        if(i===lineIndex){

            done+=input.value.length;

        }


    });



    const percent =
    done / Math.max(total,1) * 100;



    app.querySelector("#progress")
    .textContent =
    Math.round(percent)+"%";


    app.querySelector("#fill")
    .style.width =
    percent+"%";


}




function updateTime(){


    if(!started)
        return;


    const sec =
    (Date.now()-started)/1000;



    app.querySelector("#time")
    .textContent =
    `${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,"0")}`;



    app.querySelector("#cpm")
    .textContent =
    Math.round(
        input.value.length /
        Math.max(sec/60,1/60)
    );


}




function finish(){


    if(finished)
        return;


    finished=true;


    clearInterval(timer);



    stage.insertAdjacentHTML(
        "beforeend",
        `
        <p class="meta">
        완료되었습니다.
        </p>
        `
    );


    input.blur();


}



app.querySelector("#restart").onclick=()=>{

    start(item);

};



app.querySelector("#exit").onclick=()=>{

    menu();

};



app.querySelector("#stage").onclick=()=>{

    input.focus();

};



window.onkeydown=e=>{

    if(e.key==="Escape"){

        menu();

    }

};



render();


}



home();


})();
