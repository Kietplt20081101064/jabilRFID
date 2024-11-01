﻿{
    "use strict";
    var page = 1;
    var isLoadingData = false;
    var isFull = false;
    let form = $(`#TagMappingForm`)
    let table = $(`#TagMappingTable`)

    // Class Definition
    var TagMappingModify = function () {
        var _handleTagMappingForm = function () {
            let validation;

            // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
            validation = FormValidation.formValidation(
                KTUtil.getById('TagMappingForm'),
                {
                    fields: {
                        GRN: {
                            validators: {
                                notEmpty: {
                                    message: 'Please enter GRN!',
                                },
                            }
                        },
                        EPC: {
                            validators: {
                                notEmpty: {
                                    message: 'Please enter EPC!',
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

            $('#btnMapTag').on('click', function (e) {
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
                    url: '/TagMapping/MappingTag',
                    type: 'POST',
                    data: data,
                    success: function (result) {
                        // Xử lý kết quả từ action
                        if (result.status) {
                            toastr.success(
                                'Mapped!',
                                'Success'
                            );
                            form.trigger('reset');
                            DataTagMappingTable()
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
                _handleTagMappingForm();
            }
        };
    }();
    jQuery(document).ready(function () {
        TagMappingModify.init();
        initGetReadedTag()
        $('#TagMapping').scroll(function () {
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

    function DataTagMappingTable() {
        page = 1
        table.find('tbody').empty()
        ShowTagMappingTable(page)
        InitTagMappingSearch()
        InitReaderSelect()
    }


    function InitReaderSelect() {

      
        GetDataList('/FXReader/GetFXList', ShowFXReaderSelect)
    }
    ////Fxreaders Select
    let isInitFXSelectEvent = false
    var FXReaders
    function ShowFXReaderSelect(data) {
        $select = $('#FXReadersSelect')
        $select.val('').trigger('change');
        const mapData = data.map(item => {
            return {
                id: `${item.FXReaderID}`,
                text: `${item.FXReaderName} - ${item.FXReaderID}`
            };
        });
        mapData.unshift({
            id: "",
            text: `FXReaders`
        })
        $select.select2({
            placeholder: "FXReaders",

            data: mapData,

        });
        FXReaders = data
        console.log(FXReaders)
        if (!isInitFXSelectEvent) {
            //Event select customer
            FXReaderSelectEvent($select)
            isInitFXSelectEvent = true
        }

    }
    function FXReaderSelectEvent($select) {
        $select.change(function () {

        })

    }
    function InitTagMappingSearch() {
        $('#TagMappingSearch').keyup(function (event) {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode == '13' || $(this).val() == "") { // Kiểm tra nếu phím được nhấn là Enter (mã ASCII của Enter là 13)      
                table.find('tbody').empty()
                debounce(ShowTagMappingTable(1, $(this).val()), 300)
            }
        });
    }
    function ScrollData(page) {
        let search = $('#TagMappingSearch').val().trim()

        ShowTagMappingTable(page, search)
    }
    let initRowClick = function ($tr) {
        // Ap dụng sự kiện click cho các dòng ngoại trừ cột cuối
         $tr.find('td:not(:last-child)').click(function () {
            // Lấy dữ liệu từ các cột EPC và GRN ở cùng dòng
            let EPC = $(this).closest('tr').find('td.EPC').text();
             let GRN = $(this).closest('tr').find('td.GRN').text();
             GRN = GRN == 'Unassigned Tag' ? "" : GRN
            // Đặt giá trị EPC và GRN vào các trường input tương ứng
            $('input[name="EPC"]').val(EPC);
            $('input[name="GRN"]').val(GRN);
        });
    }
    let ShowTagMappingTable = debounce(function (pagenumber, search) {
        $.ajax({
            type: "GET",
            url: "/TagMapping/GetTagMapping",
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
                        let tr = `<tr class="table-row" data-epc="${v.EPC}">
                            <th scope="row">${((10 * (data.pageCurrent - 1)) + (i + 1))}</th>
                        
                            <td class="EPC">${v.EPC}</td>
                            <td class="GRN">${v.GRN}</td>
                            <td>
                                <a href="#" class="btn btn-light-danger font-weight-bold mr-2 btnDeleteTag">Delete</a>
                                <a href="#" class="btn btn-light-warning font-weight-bold mr-2 btnUnmapTag">Unmap</a>
                            </td>
                            </tr>`

                        body.append(tr)
                        initRowClick($(body.find('tr').last()))
                    })
                    pagenumber++
                    page = pagenumber
                    $('.btnDeleteTag').click(function (e) {
                        e.preventDefault()
                        let epc = $(this).closest('tr').data('epc')
                        DeleteTag(epc)
                    })
                    $('.btnUnmapTag').click(function (e) {
                        e.preventDefault()
                        let epc = $(this).closest('tr').data('epc')
                        UnmapTag(epc)
                    })

                    isFull = data.to == data.total

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

    }, 200)

    function initGetReadedTag() {
        $('#btnGetReadedEPC').click(debounce((e) => {
            let id = $('#FXReadersSelect').val()
            if (id != '') {
                $.ajax({
                    url: '/RFID/NewestShowEPC',
                    type: 'Get',
                    data: { id },
                    success: function (result) {
                        // Xử lý kết quả từ action
                        if (result.status) {
                            $('input[name="EPC"]').val(result.epc)
                        } else {
                            // Hiển thị thông báo lỗi
                            toastr.error(
                                result.message,
                                'Erorr'
                            );

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
            } else {
                toastr.error(
                    'Please select FXReader!',
                    'Erorr'
                );
            }
           

        },300))
       
    }
}
const DeleteTag = debounce(function (epc) {
    $.ajax({
        type: "POST",
        url: '/TagMapping/DeleteTag',

        data: {
            id:epc
        },
        success: function (result) {
            // Xử lý kết quả từ action
            if (result.status) {
                toastr.success(
                    'Deleted!',
                    'Success'
                );

                DataTagMappingTable()
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
}, 300)
const UnmapTag = debounce(function (epc) {
    $.ajax({
        type: "POST",
        url: '/TagMapping/UnMap',

        data: {
            id:epc
        },
        success: function (result) {
            // Xử lý kết quả từ action
            if (result.status) {
                toastr.success(
                    'Umapped!',
                    'Success'
                );

                DataTagMappingTable()
            } else {
                // Hiển thị thông báo lỗi
                toastr.error(
                    result.Message,
                    'Error'
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
}, 300)