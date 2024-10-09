{
"use strict";
var page = 1;
var isLoadingData = false;
var isFull = false;
let form = $(`#RolesForm`)
let table = $(`#RolesTable`)
// Class Definition
var RoleModify = function () {
    
    var _handleRolesForm = function () {
        let validation;

        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        validation = FormValidation.formValidation(
            KTUtil.getById('RolesForm'),
            {
                fields: {
                    RoleName: {
                        validators: {
                            notEmpty: {
                                message: `Enter Role Permission Name!`
                            }
                        }
                    },
                    Description: {
                        validators: {
                            notEmpty: {
                                message: `Enter Description`
                            },
                           
                        }
                    }
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    submitButton: new FormValidation.plugins.SubmitButton(),
                    //defaultSubmit: new FormValidation.plugins.DefaultSubmit(), // Uncomment this line to enable normal button submit after form validation
                    bootstrap: new FormValidation.plugins.Bootstrap()
                }
            }
        );

        $('#btnSaveRole').on('click', function (e) {
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
           
            // Gửi Ajax request đến action "ModifyRole"
            $.ajax({
                url: '/Role/ModifyRole',
                type: 'POST',
                data: data,
                success: function (result) {
                    // Xử lý kết quả từ action
                    if (result.status) {
                        toastr.success(
                            'Saved!',
                            'Success'
                        );
                        form.trigger('reset');
                        DataRoleTable()
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
    var _handleRemoveRolesForm = function () {
        let validation;

        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        validation = FormValidation.formValidation(
            KTUtil.getById('RolesForm'),
            {
                fields: {
                    RoleID: {
                        validators: {
                            notEmpty: {
                                message: `Role is not valid!`
                            }
                        }
                    },
                    RoleName: {
                        validators: {
                            notEmpty: {
                                message: `Enter Role Permission Name!`
                            }
                        }
                    },
                    Description: {
                        validators: {
                            notEmpty: {
                                message: `Enter Description`
                            },

                        }
                    }
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    submitButton: new FormValidation.plugins.SubmitButton(),
                    //defaultSubmit: new FormValidation.plugins.DefaultSubmit(), // Uncomment this line to enable normal button submit after form validation
                    bootstrap: new FormValidation.plugins.Bootstrap()
                }
            }
        );

        $('#btnDeleteRole').on('click', function (e) {
            e.preventDefault();

            validation.validate().then(function (status) {
                if (status == 'Valid') {
                    let data = $('input[name="RoleID"]').val()
                    Swal.fire({
                        title: `Are you sure?`,
                        text: "You won't be able to revert this!",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, delete it!'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            Delete(data)
                        }
                    })


                } else {
                    toastr.error(
                        'Something wrong!',
                        'Error'
                    );

                }
            });
        });
        function Delete(id) {

            $.ajax({
                url: '/Role/DeleteRole',
                type: 'POST',
                data: { id },

                success: function (result) {
                    // Xử lý kết quả từ action
                    if (result.status) {
                        toastr.success(
                            'Deleted!',
                            'Success'
                        );
                        form.trigger('reset');
                        DataRoleTable()
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


            _handleRolesForm();
            _handleRemoveRolesForm();
        }
    };
}();
jQuery(document).ready(function () {
    RoleModify.init();

    ///Sự kiến cuộn bảng
    $('#Roles').scroll(function () {
        /* var element = $(this)[0];*/
        var scrollTop = $(this).scrollTop() + 3;
        var scrollHeight = $(this)[0].scrollHeight;
        var windowHeight = $(this).outerHeight();

        if (scrollTop + windowHeight >= scrollHeight && !isLoadingData && !isFull) {

            // Đạt đến cuối trang và không đang lấy dữ liệu
            $('.spinner').show();
            // Gọi hàm để lấy dữ liệu tiếp theo
            ScrollData(page);
            console.log(page)
        }
    });
 


});

function DataRoleTable() {
    page = 1
    table.find('tbody').empty()
    ShowRoleTable(page)


    InitRoleSearch()
}
    function InitRoleSearch() {
        $('#RoleSearch').keyup(function (event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13' || $(this).val() == "") { // Kiểm tra nếu phím được nhấn là Enter (mã ASCII của Enter là 13)      
                table.find('tbody').empty()
                ShowRoleTable(1, $(this).val())
            }
        });
    }
function ScrollData(page) {
    let search = $('#RoleSearch').val().trim()

    ShowRoleTable(page, search)
}
let initRowClick=  function ($tr) {
    $tr.click(function () {
        let RoleID = $(this).data('roleid')
        GetRoleDetail(RoleID)
    })
}

    var GetRoleDetail=debounce( function (RoleID) {

    $.ajax({
        type: "POST",
        url: "/Role/GetRoleDetail",
        data: {
          RoleID
        },

        datatype: 'json',
        success: function (response) {
            if (response.status) {
                let data = response.data
                $('[name="RoleID"]').val(data.RoleID)
                $('[name="RoleName"]').val(data.RoleName)
                $('[name="Description"]').val(data.Description)
                // Kiểm tra các ô checkbox
                $('input[name="PermissionCheckbox"]').each(function () {
                    var checkboxValue = $(this).val();

                    // Kiểm tra giá trị của checkbox có tồn tại trong danh sách quyền
                    var hasPermission = data.Permissions.some(function (permission) {
                        return permission.PermisstionID === parseInt(checkboxValue);
                    });

                    if (hasPermission) {
                        // Đánh dấu checkbox nếu có quyền tương ứng
                        $(this).prop('checked', true);
                    } else {
                        $(this).prop('checked', false);
                    }
                });
            } else {
                toastr.error(
                    response.message,
                    'Erorr'
                );
            }
            
            
        },
        error: function (xhr, status, error) {
            var err = JSON.parse(xhr.responseText);
            console.l(err.Message);
        }
    })
    }, 200)
    var ShowRoleTable =debounce( function (pagenumber, search) {
        if (!isLoadingData) {
            let body = table.find('tbody')
            $.ajax({
                type: "GET",
                url: "/Role/GetRoles",
                data: {
                    search,
                    page: pagenumber,
                },
                beforeSend: function () {
                    isLoadingData = true
                },
                datatype: 'json',
                success: function (data) {


                    isFull = false
                    //Hiển thị dữ liệu trong bảng

                    if (data.data && data.data.length > 0) {
                        $.each(data.data, function (i, v) {
                            /*  <td>${v.MemberCardID}</td>*/
                            let tr = `<tr class="table-row" data-roleid ="${v.RoleID}">
                            <th scope="row">${((10 * (data.pageCurrent - 1)) + (i + 1))}</th>
                        
                            <td class="FXReaderID">${v.RoleName}</td>
                            <td class="IPAddress">${v.Description}</td>
 
                            </tr>`

                            body.append(tr)
                            initRowClick($(body.find('tr').last()))
                        })
                        pagenumber++
                        page = pagenumber


                        isFull = data.to == data.total

                    }
                    $('.spinner').hide();
                    isLoadingData = false;

                    table.parent().next().find('.dataTables_info').text(`Showing ${data.to} of ${data.total} records`)
                },
                error: function () {
                    // Xử lý lỗi (nếu cần thiết)
                    // Ẩn loading indicator và cho phép lấy dữ liệu tiếp theo
                    $('.spinner').hide();
                    isLoadingData = false;
                }
            })
        }

    },200)
}