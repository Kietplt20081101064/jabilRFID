{
    "use strict";
    var page = 1;
    var isLoadingData = false;
    var isFull = false;
    let form = $(`#SettingsForm`)
    

    // Class Definition
    var SettingsModify = function () {
        var _handleSettingsForm = function () {
            let validation;

            // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
            validation = FormValidation.formValidation(
                KTUtil.getById('SettingsForm'),
                {
                    fields: {
                        ApiUrl: {
                            validators: {
                                uri: {
                                    message: 'The website address is not valid',
                                },
                            }
                        },
                        identificationId: {
                            validators: {
                                notEmpty: {
                                    message: 'The Identification Id is require',
                                },
                            }
                        },
                        secretKey: {
                            validators: {
                                notEmpty: {
                                    message: 'The SecretKey is require',
                                },
                            }
                        },
                    },
                    plugins: {
                        trigger: new FormValidation.plugins.Trigger(),
                        submitButton: new FormValidation.plugins.SubmitButton(),
                        //defaultSubmit: new FormValidation.plugins.DefaultSubmit(), // Uncomment this line to enable normal button submit after form validation
                        bootstrap: new FormValidation.plugins.Bootstrap()
                    }
                }
            );

            $('#btnSaveSetting').on('click', function (e) {
                e.preventDefault();

                validation.validate().then(function (status) {
                    if (status == 'Valid') {
                        var formdata = form.serialize()

                        Save(formdata)

                    } else {
                        toastr.error(
                            'Something wrong!',
                            'Error'
                        );

                    }
                });
            });
            function Save(data) {
                // Gửi Ajax request đến action "Login"
                $.ajax({
                    url: '/Setting/SetSettingData',
                    type: 'POST',
                    data: data,
                    success: function (result) {
                        // Xử lý kết quả từ action
                        if (result.status) {
                            toastr.success(
                                'Saved!',
                                'Success'
                            );

                        } else {
                            // Hiển thị thông báo lỗi
                            toastr.error(
                                result.message,
                                'Erorr'
                            );
                            KTUtil.scrollTop();
                        }
                    },
                    error: function () {
                        // Xử lý lỗi khi gửi Ajax request
                        toastr.error(
                            'Something wrong!',
                            'Erorr'
                        );
                        KTUtil.scrollTop();
                    }
                });
            }


        }
        

        // Public Functions
        return {
            // public functions
            init: function () {
                _handleSettingsForm();   
            }
        };
    }();
    jQuery(document).ready(function () {
        SettingsModify.init();
        
       

    });
    function InitSettingData() {
        $.ajax({
            url: '/Setting/GetSettingData',
            type: 'Get',
            
            success: function (result) {
                // Xử lý kết quả từ action
                if (result.status) {

                    var url = result.data.ApiUrl
                    var newUrl = url.replace("https://", "");         
                    $('input[name="ApiUrl"]').val(newUrl)
                  
                    initUrlMask()

                    $('input[name="identificationId"]').val(result.data.identificationId)
                    $('input[name="secretKey"]').val(result.data.secretKey)
                } else {
                    // Hiển thị thông báo lỗi
                    toastr.error(
                        result.message,
                        'Erorr'
                    );
                    KTUtil.scrollTop();
                }
            },
            error: function () {
                // Xử lý lỗi khi gửi Ajax request
                toastr.error(
                    'Something wrong!',
                    'Erorr'
                );
                KTUtil.scrollTop();
            }
        });
    }
    function initUrlMask() {
       
        $('input[name="ApiUrl"]').inputmask({ regex: "https://.*" });
    }
}