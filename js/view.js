
$(document).ready(function() {

	// Show/Hide Progress Bar
    btnSettings = document.querySelector("#import");
    btnSettings.addEventListener ('click', function () {
        viewSettings.classList.remove('move-down');
        viewSettings.classList.add('move-up');
    });

    doneBtn = document.querySelector("#done");
    doneBtn.addEventListener ('click', function () {
        hideProgressModal();
    });

    function showProgressModal(){
    	hideDoneBtn();
    	btnSettings.trigger('click');
    }

    function hideProgressModal(){
      viewSettings = document.querySelector("#progress");
      viewSettings.classList.remove('move-up');
      viewSettings.classList.add('move-down');
    }

    function hideDoneBtn(){
      doneBtn.classList.remove('move-up');
      doneBtn.classList.add('move-down');
    }

    hideProgressModal();
    hideDoneBtn();
});