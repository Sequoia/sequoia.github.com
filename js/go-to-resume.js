// skip it if browser does not have KeyboardEvent.key
if((new KeyboardEvent('')).key !== 'undefined'){
    document.addEventListener('DOMContentLoaded', typeToResume)
}

/**
 * send the user to my resume if they type "resume"
 */
function typeToResume(){
    target = 'resume'.split('');
    nextKey = 0;

    document.body.addEventListener('keydown', function(e){
        if(e.key.toLowerCase() === target[nextKey]){
            nextKey++;
            if(nextKey === target.length){
            //they typed "resume"! Send user to resume
            window.location = '/s/resume.pdf'
            }
        }else{
            nextKey = 0;
        }
    });   
}