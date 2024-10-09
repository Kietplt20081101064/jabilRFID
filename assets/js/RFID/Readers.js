{
"use strict";
var page = 1;
var isLoadingData = false;
var isFull = false;
let form = $(`#ReadersForm`)
let table = $(`#ReadersTable`)

// Class Definition
var FxReaderModify = function () {
    var _handleReadersForm = function () {
        let validation;

        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        validation = FormValidation.formValidation(
            KTUtil.getById('ReadersForm'),
            {
                fields: {
                    FXReaderID: {
                        validators: {
                            notEmpty: {
                                message: `Enter Reader's ID!`
                            }
                        }
                    },
                    FXReaderName: {
                        validators: {
                            notEmpty: {
                                message: `Enter Reader's Name!`
                            }
                        }
                    },
                    FXReaderUser: {
                        validators: {
                            notEmpty: {
                                message: `Enter Reader's User!`
                            }
                        }
                    },
                    FXReaderPassword: {
                        validators: {
                            notEmpty: {
                                message: `Enter Reader's Password!`
                            }
                        }
                    },
                    IPAddress: {
                        validators: {
                            notEmpty: {
                                message: `Enter Reader's IP!`
                            },
                            ip: {
                                message: 'The value is not valid IP address',
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

        $('#btnSaveFXReader').on('click', function (e) {
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
                url: '/FXReader/ModifyReader',
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
                        DataReaderTable()
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
    //var _handleRemoveReadersForm = function () {
    //    let validation;

    //    // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
    //    validation = FormValidation.formValidation(
    //        KTUtil.getById('ReadersForm'),
    //        {
    //            fields: {
    //                FXReaderID: {
    //                    validators: {
    //                        notEmpty: {
    //                            message: `Enter Reader's Name!`
    //                        }
    //                    }
    //                },
                   
    //            },
    //            plugins: {
    //                trigger: new FormValidation.plugins.Trigger(),
    //                submitButton: new FormValidation.plugins.SubmitButton(),
    //                //defaultSubmit: new FormValidation.plugins.DefaultSubmit(), // Uncomment this line to enable normal button submit after form validation
    //                bootstrap: new FormValidation.plugins.Bootstrap()
    //            }
    //        }
    //    );

    //    $('#btnDeleteFXReader').on('click', function (e) {
    //        e.preventDefault();

    //        validation.validate().then(function (status) {
    //            if (status == 'Valid') {
    //              let data = $('input[name="FXReaderID"]').val()
    //                Swal.fire({
    //                    title: 'Are you sure?',
    //                    text: "You won't be able to revert this!",
    //                    icon: 'warning',
    //                    showCancelButton: true,
    //                    confirmButtonColor: '#3085d6',
    //                    cancelButtonColor: '#d33',
    //                    confirmButtonText: 'Yes, delete it!'
    //                }).then((result) => {
    //                    if (result.isConfirmed) {
    //                        Delete(data)
    //                    }
    //                })
                  
                    
    //            } else {
    //                toastr.error(
    //                    'Something wrong!',
    //                    'Error'
    //                );
                    
    //            }
    //        });
    //    });
        

       
    //}

    // Public Functions
    return {
        // public functions
        init: function () {
          

            _handleReadersForm();
            /*_handleRemoveReadersForm();*/
        }
    };
}();
jQuery(document).ready(function () {
    FxReaderModify.init();
    
    ///Sự kiến cuộn bảng
    $('#FXReaders').scroll(function () {
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
    let InitCheckBtn = function () {
        
        $('.btnCheckMachineForReader').click(function () {
            let machineName = $(this).closest('.input-group').find('input[name="MachineName"]').val();
            CheckMachineForReader(machineName)
        })
        $('input[name="MachineName"]').keyup(function (e) {
            if (e.keyCode == 13) {
            let machineName = $(this).closest('.input-group').find('input[name="MachineName"]').val();
                CheckMachineForReader(machineName)
            }
        });

    }
    let CheckMachineForReader = debounce(function (MachineName) {
        MachineName = MachineName.trim()
        if (MachineName != "") {
            $.ajax({
                type: "Get",
                url: "/JabilAPI/GetEquipmentByName",
                data: {
                    MachineName
                },

                datatype: 'json',
                success: function (response) {
                    if (response.Status) {
                        let data = response.Data
                        if (data.FXReaderID != null) {
                            $('input[name="MachineInfo"], input[name="MachineID"]').val('');

                            toastr.error(
                                `Machine is mapped with Reader: ${data.FXReaderID}`,
                                'Erorr'
                            );
                        } else {
                            $('input[name="MachineInfo"]').val(`${data.Vendor}/${data.Model}/${data.CommonName}`)
                            $('input[name="MachineID"]').val(`${data.Equipment_ID}`)
                        }


                    } else {
                        $('input[name="MachineInfo"], input[name="MachineID"]').val('');

                        toastr.error(
                            response.message,
                            'Erorr'
                        );
                    }
                },
                error: function (xhr, status, error) {
                    var err = JSON.parse(xhr.responseText);
                    console.log(err.Message);
                }
            })
        }
       
    }, 300)
    function DataReaderTable() {
        page = 1
        table.find('tbody').empty()
        ShowReaderTable(page)
        InitReaderSearch()
        InitCheckBtn()
    }

    function InitReaderSearch() {
        $('#ReaderSearch').keyup(function (event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13' || $(this).val() == "" ) { // Kiểm tra nếu phím được nhấn là Enter (mã ASCII của Enter là 13)      
                table.find('tbody').empty()
               debounce(ShowReaderTable(1, $(this).val()),300)
            }
        });
    }


function ScrollData(page) {
    let search = $('#ReaderSearch').val().trim()
   
    ShowReaderTable(page, search)
}

let initRowClick= function ($tr) {
    
    $tr.find('td:not(:last-child)').click(function () {
        // Lấy dữ liệu từ các cột ở cùng dòng
       
            $form.find('input[name="MachineName"]').val('');
          
            let ReaderID = $tr.find('td.FXReaderID').text()
            let FXReaderName = $tr.find('td.FXReaderName').text()
            let IPAddress = $tr.find('td.IPAddress').text()
            let MachineInfo = $tr.find('td.MachineInfo').text()
            let AuthCode = $tr.find('td.AuthCode').text()
            // Đặt giá trị các trường input tương ứng
            var e = jQuery.Event("keypress");
            $('input[name="FXReaderID"]').val(ReaderID)
            $('input[name="FXReaderName"]').val(FXReaderName)
            $('input[name="MachineInfo"]').val(MachineInfo)
            $('input[name="IPAddress"]').val(IPAddress).trigger(e)
        if (AuthCode != '') {
            let FxUser = atob(AuthCode).split(':')[0]
            let FxPass = atob(AuthCode).split(':')[1]
            $('input[name="FXReaderUser"]').val(FxUser)
            $('input[name="FXReaderPassword"]').val(FxPass)
        } else {
            $('input[name="FXReaderUser"]').val('')
            $('input[name="FXReaderPassword"]').val('')
        }

    });
}
    let ShowReaderTable = debounce(function (pagenumber,search) {
        $.ajax({
            type: "GET",
            url: "/FXReader/GetFX",
            data: {
                search,
                page: pagenumber,
            },

            datatype: 'json',
            success: function (data) {

                let body = table.find('tbody')
                isFull = false
                //Hiển thị dữ liệu trong bảng

                if (data.data && data.data.length > 0) {
                    $.each(data.data, function (i, v) {
                        /*  <td>${v.MemberCardID}</td>*/
                        let tr = `<tr class="table-row" data-readerid="${v.FXReaderID}">
                            <th scope="row">${((10 * (data.pageCurrent - 1)) + (i + 1))}</th>
                        
                            <td class="FXReaderID">${v.FXReaderID}</td>
                            <td class="FXReaderName">${v.FXReaderName}</td>
                            <td class="IPAddress">${v.IPAddress}</td>
                            <td class="MachineInfo">${v.MachineInfo}</td>
                            <td hidden class="AuthCode">${v.AuthorizationCode}</td>
                            <td>
                                <a href="#" class="btn btn-light-danger font-weight-bold mr-2 btnDelete">Delete</a>
                                <a href="#" class="btn btn-light-warning font-weight-bold mr-2 btnUnmap">Unmap</a>
                            </td>
                            </tr>`

                        body.append(tr)
                        initRowClick($(body.find('tr').last()))
                    })
                    pagenumber++
                    page = pagenumber


                    isFull = data.to == data.total
                    //Delete
                    $('.btnDelete').click(function (e) {
                        e.preventDefault()
                        let readerid = $(this).closest('tr').data('readerid')
                        Delete(readerid)
                    })
                    $('.btnUnmap').click(function (e) {
                        e.preventDefault()
                        let readerid = $(this).closest('tr').data('readerid')
                        Unmap(readerid)
                    })

                    function Delete(id) {

                        $.ajax({
                            url: '/FXReader/DeleteReader',
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
                                    DataReaderTable()
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
                    function Unmap(id) {

                        $.ajax({
                            url: '/FXReader/UnmapReader',
                            type: 'POST',
                            data: { id },

                            success: function (result) {
                                // Xử lý kết quả từ action
                                if (result.status) {
                                    toastr.success(
                                        'Unmapped!',
                                        'Success'
                                    );
                                    form.trigger('reset');
                                    DataReaderTable()
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
                $('.spinner').hide();
                isLoadingData = false;

                $('#QtyNote').text(`Showing ${data.to} of ${data.total} records`)
            },
            error: function () {
                // Xử lý lỗi (nếu cần thiết)
                // Ẩn loading indicator và cho phép lấy dữ liệu tiếp theo
                $('.spinner').hide();
                isLoadingData = false;
            }
        })

    },200)
}