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
  $('#login').validate({
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
      },
      pass: {
        required: true
      }
    },
    messages: {
      email: {
        required: '',
        email: ''
      },
      pass: {
        required: ''
      }
    },
    submitHandler: function(form) {
      $(form).ajaxSubmit({
        success: function (response) {
          if (response == 'ok') {
            UIkit.notify("Код callmaker успешно установлен в ваш магазин", {timeout: 0});
            setTimeout(function(){
              window.location.replace('/');
            }, 3000);
          } else if (response == 'err') {
            UIkit.notify("Неправильный логин или пароль", {timeout: 0});
          } else {
            UIkit.notify(response, {timeout: 0});
          }
        }
      });
      return false;
    }
  });
  $('#reg').validate({
    errorPlacement: function(error, element) {
      element.closest('.uk-form-row').append(error);
      error.addClass('b-error-validation uk-margin-remove uk-text-small');
    },
    errorElement: 'p',
    errorClass: 'uk-form-danger',
    validClass: 'uk-form-success',
    highlight: function(element, errorClass, validClass) {
      $(element).addClass(errorClass).removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).removeClass(errorClass).addClass(validClass);
    },
    rules: {
      url: {
        required: true
      },
      name: {
        required: true
      },
      email: {
        required: true,
        email: true
      },
      pass: {
        required: true
      },
      phone: {
        required: true,
        digits: true,
        minlength: 10,
        maxlength: 10
      }
    },
    messages: {
      url: {
        required: 'Введите адрес, например shop.ru'
      },
      name: {
        required: ''
      },
      email: {
        required: '',
        email: ''
      },
      pass: {
        required: ''
      },
      phone: {
        required: 'Введи номер телефона, например 4951234567',
        digits: 'Введи номер телефона, например 4951234567',
        minlength: 'Введи номер телефона, например 4951234567',
        maxlength: 'Введи номер телефона, например 4951234567'
      }
    },
    submitHandler: function(form) {
      $(form).ajaxSubmit({
        success: function (response) {
          if (response == 'ok') {
            UIkit.notify("Код callmaker успешно установлен в ваш магазин", {timeout: 0});
            setTimeout(function(){
              window.location.replace('/');
            }, 3000);
          } else {
            UIkit.notify(response, {timeout: 0});
          }
        }
      });
      return false;
    }
  });
});