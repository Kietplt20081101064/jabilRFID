{
    "use strict";
    var page = 1;
    var isLoadingData = false;
    var isFull = false;
    let form = $(`#UsersForm`)
    let table = $(`#UsersTable`)
    // Class Definition
    var UserModify = function () {

        var _handleUsersForm = function () {
            let validation;

            // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
            validation = FormValidation.formValidation(
                KTUtil.getById('UsersForm'),
                {
                    fields: {
                        JabilID: {
                            validators: {
                                notEmpty: {
                                    message: `ID is not valid!`
                                }
                            }
                        },
                        UserName: {
                            validators: {
                                notEmpty: {
                                    message: `User Name is not valid`
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

            $('#btnSaveUser').on('click', function (e) {
                e.preventDefault();

                validation.validate().then(function (status) {
                    if (status == 'Valid') {


                        var formdata = form.serializeArray()

                        let cus = []
                        $('input[name="CustomerCheck"]:checked').each(function () {
                            cus.push({ ID: this.value, Name: $(this).parent().text().trim() });

                        });


                        var dataToSend = {
                            formData: formdata,
                            customerData: cus
                        };
                        console.log(dataToSend)
                        Save(dataToSend)

                    } else {
                        toastr.error(
                            'Something wrong!',
                            'Error'
                        );

                    }
                });
            });
            function Save(data) {


                // Gửi Ajax request đến action
                $.ajax({
                    type: "POST",
                    url: '/User/UpdateUser',
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(data),

                    success: function (result) {
                        // Xử lý kết quả từ action
                        if (result.Status) {
                            toastr.success(
                                'Saved!',
                                'Success'
                            );
                            form.trigger('reset');
                            DataUserTable()
                        } else {
                            // Hiển thị thông báo lỗi
                            toastr.error(
                                result.Message,
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
            $('#btnAddUser').on('click', function (e) {
                e.preventDefault();

                validation.validate().then(function (status) {
                    if (status == 'Valid') {


                        var formdata = form.serializeArray()

                        let cus = []
                        $('input[name="CustomerCheck"]:checked').each(function () {
                            cus.push({ ID: this.value, Name: $(this).parent().text().trim() });

                        });


                        var dataToSend = {
                            formData: formdata,
                            customerData: cus
                        };
                      
                        CheckValidUser(dataToSend, Add)
                     

                    } else {
                        toastr.error(
                            'Something wrong!',
                            'Error'
                        );

                    }
                });
            });
            function CheckValidUser(data, callback) {
                // Gửi Ajax request đến action

                let ntid = data.formData.find(item => item.name === "JabilID").value
                $.ajax({
                    type: "POST",
                    url: '/JabilAPI/GetUserByWindowsId',
                   
                    data: { ntid },

                    success: function (result) {
                        // Xử lý kết quả từ action
                        if (result.Status) {
                            data.UserID_ID = result.Data
                            callback(data)
                        } else {
                            // Hiển thị thông báo lỗi
                            toastr.error(
                                result.Message,
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
        
            function Add(data) {


                // Gửi Ajax request đến action
                $.ajax({
                    type: "POST",
                    url: '/User/AddUser',
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(data),

                    success: function (result) {
                        // Xử lý kết quả từ action
                        if (result.Status) {
                            toastr.success(
                                'Added!',
                                'Success'
                            );
                            form.trigger('reset');
                            DataUserTable()
                        } else {
                            // Hiển thị thông báo lỗi
                            toastr.error(
                                result.Message,
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
        var _handleRemoveUsersForm = function () {
            let validation;

            // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
            validation = FormValidation.formValidation(
                KTUtil.getById('UsersTable'),
                {
                    fields: {
                        UserID: {
                            excluded: false,    // Don't ignore me, please!
                            validators: {
                                notEmpty: {
                                    message: 'Select an account to delete!'
                                }
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

            $('#btnDeleteUser').on('click', function (e) {
                e.preventDefault();

                validation.validate().then(function (status) {
                    if (status == 'Valid') {
                        let data = $('input[name="JabilID"]').val()
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
                    url: '/User/DeleteUser',
                    type: 'POST',
                    data: { UserID:id },

                    success: function (result) {
                        // Xử lý kết quả từ action
                        if (result.Status) {
                            toastr.success(
                                'Deleted!',
                                'Success'
                            );
                            form.trigger('reset');
                            DataUserTable()
                        } else {
                            // Hiển thị thông báo lỗi
                            toastr.error(
                                result.Message,
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


                _handleUsersForm();
                _handleRemoveUsersForm();
            }
        };
    }();
    jQuery(document).ready(function () {
        UserModify.init();

        ///Sự kiến cuộn bảng
        $('#Users').scroll(function () {
            /* var element = $(this)[0];*/
            var scrollTop = $(this).scrollTop() + 3;
            var scrollHeight = $(this)[0].scrollHeight;
            var windowHeight = $(this).outerHeight();

            if (scrollTop + windowHeight >= scrollHeight && !isLoadingData && !isFull) {

                // Đạt đến cuối trang và không đang lấy dữ liệu
                /* $('.spinner').show();*/
                // Gọi hàm để lấy dữ liệu tiếp theo
                ScrollData(page);
                console.log(page)
            }
        });



    });

    var InitUserForm = debounce(function () {
        InitCustomersCheckbox()
        DataUserTable()
        InitRolesSelect()

    }, 300)

    function InitCustomersCheckbox() {

        GetDataList('/JabilAPI/GetListCustomer', ShowCustomerCheckBox)
    }
     function InitRolesSelect() {

         GetDataList('/Role/GetRolesList', SetRolesSelect)
    }

    
    function DataUserTable() {
        page = 1
        table.find('tbody').empty()
        ShowUserTable(page)
         InitUserSearch()
    }
    function InitUserSearch() {
        $('#UserSearch').keyup(function (event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13' || $(this).val() == "") { // Kiểm tra nếu phím được nhấn là Enter (mã ASCII của Enter là 13)      
                table.find('tbody').empty()
                ShowUserTable(1, $(this).val())
            }
        });
    }
    function ScrollData(page) {
        let search = $('#UserSearch').val().trim()
        ShowUserTable(page, search)
    }
    function initUserRowClick($tr) {
        $tr.click(function () {
            let UserID = $(this).data('userid')
            GetUserDetail(UserID)
        })
    }

    const GetUserDetail = debounce(function (UserID) {
        $.ajax({
            type: "POST",
            url: "/User/GetUserDetail",
            data: {
                UserID
            },

            datatype: 'json',
            success: function (response) {
                if (response.Status) {
                    let data = response.Data
                    console.log(data)
                    $('[name="JabilID"]').val(data.JabilID)
                    $('[name="UserName"]').val(data.AccountName)
                    $('#RolesSelect').val(data.RoleID).trigger('change')

                    /*Kiểm tra các ô checkbox*/
                    $('input[name="CustomerCheck"]').each(function () {
                        var checkboxValue = $(this).val();

                        // Kiểm tra giá trị của checkbox có tồn tại trong danh sách quyền
                        var hasCutomer = data.Customers.some(function (customer) {
                            return customer === parseInt(checkboxValue);
                        });

                        if (hasCutomer) {
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
    }, 300)
    var ShowUserTable =  debounce(function (pagenumber, search) {
        if (!isLoadingData) {
            let body = table.find('tbody')
            $.ajax({
                type: "GET",
                url: "/User/GetUsers",
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
                            let tr = `<tr class="table-row" data-userid ="${v.EmployeeID}">
                            <th scope="row">${((10 * (data.pageCurrent - 1)) + (i + 1))}</th>
                            <td>${v.JabilID}</td>
                            <td>${v.FullName}</td>
                            <td>${v.Role}</td>
 
                    </tr>`

                            body.append(tr)
                            initUserRowClick($(body.find('tr').last()))
                        })
                        pagenumber++
                        page = pagenumber


                        isFull = data.to == data.total

                    }

                    isLoadingData = false;

                    table.parent().next().find('.dataTables_info').text(`Showing ${data.to} of ${data.total} records`)
                },
                error: function () {

                }
            })
        }

    },200)

}
function ShowCustomerCheckBox(data) {
    let dataInRows = 4
    let rowsNumber = Math.ceil(data.length / dataInRows)
    let checkBoxes = `<div class="checkbox-inline">`
    $.each(data, function (i, v) {
        checkBoxes += `<label style="width: 150px;" class="checkbox checkbox-square">
                                            <input type="checkbox" value="${v.Customer_ID}" name="CustomerCheck" />
                                            <span></span>
                                            ${v.CustomerName}
                                        </label>`
        if (i + 1 == data.length) checkBoxes += `</div>`
        else if ((i + 1) % 4 == 0) checkBoxes += `</div><div class="checkbox-inline">`

    })
    $('#CustomerChecks').empty()
    $('#CustomerChecks').append(checkBoxes)
    $('#loadingCustomer').hide();
}
function SetRolesSelect(data) {
    
    $select = $('#RolesSelect')
    $select.empty()
    $.each(data, function (i, v) {
        let option = ` <option value="${v.ID}">${v.Name}</option>`
        $select.append(option)
    })
}