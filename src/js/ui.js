$(document).ready(function() {
  $('.aff').attr('href', function() {
    return this.href + '?referral=pomeo@pomeo.ru';
  });
  $('#remember').validate({
    errorClass: 'uk-form-danger',
    validClass: 'uk-form-success',
    highlight: function(element, errorClass, validClass) {
      $(element).addClass(errorClass).removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).removeClass(errorClass).addClass(validClass);
    },
    rules: {
      email: {
        required: true,
        email: true
      }
    },
    messages: {
      email: {
        required: '',
        email: ''
      }
    },
    submitHandler: function(form) {
      $(form).ajaxSubmit({
        success: function (response) {
          if (response == 'ok') {
            UIkit.notify("Пароль отправлен на вашу почту", {timeout: 0});
            setTimeout(function(){
              window.location.replace('/login');
            }, 3000);
          } else if (response == 'err') {
            UIkit.notify("Почта не существует", {timeout: 0});
          } else {
            UIkit.notify(response, {timeout: 0});
          }
        }
      });
      return false;
    }
  });
});