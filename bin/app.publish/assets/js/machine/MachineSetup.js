{
    "use strict";
    var page = 1;
    var isLoadingData = false;
    var isFull = false;
    let form = $(`#MachinesForm`)
    let table = $(`#MachinesTable`)
    // Class Definition
    var MachineModify = function () {

        var _handleMachineForm = function () {
            let validation;

            // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
            validation = FormValidation.formValidation(
                KTUtil.getById('MachinesForm'),
                {
                    fields: {
                        CustomerID: {
                            validators: {
                                callback: {
                                    message: 'Please select customer',
                                    callback: function (input) {
                                        // Get the selected options
                                        const option = $("#CustomersSelect").val();
                                        return option != "";
                                    },
                                },
                            }
                        },MachineName: {
                            validators: {
                                notEmpty: {
                                    message: `Please enter!`
                                }
                            }
                        },
                        MachineInfo: {
                            validators: {
                                notEmpty: {
                                    message: `Please enter!`
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

            $('#btnSaveMachine').on('click', function (e) {
                e.preventDefault();

                validation.validate().then(function (status) {
                    if (status == 'Valid') {
                        let data = {
                            CusID: $('#CustomersSelect').val(),
                            CusName: $('#CustomersSelect option:selected').text(),
                            MachineID: $('input[name="MachineID"]').val(),
                            MachineInfo: $('input[name="MachineInfo"]').val()
                        };
                        
                        Save(data)

                    } else {
                        toastr.error(
                            'Please enter all valid values!',
                            'Error'
                        );

                    }
                });
            });
            const Save = debounce( function (data) {


                // Gửi Ajax request đến action
                $.ajax({
                    type: "POST",
                    url: '/Machine/AddMachineToCustomer',
                   /* contentType: "application/json; charset=utf-8",*/
                    data: data,

                    success: function (result) {
                        // Xử lý kết quả từ action
                        if (result.Status) {
                            toastr.success(
                                'Saved!',
                                'Success'
                            );
                           
                            DataMachineTable(CurrentCusID)
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
                
            },300)


        }
       

        // Public Functions
        return {
            // public functions
            init: function () {


                _handleMachineForm();
                
            }
        };
    }();
    jQuery(document).ready(function () {
        MachineModify.init();

        ///Sự kiến cuộn bảng
        $('#Machines').scroll(function () {
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
    var CurrentCusID=0
    var InitMachineForm = debounce(function () {
        InitCustomerSelect()
        InitMachineCheckBtn()
        InitSearch()

    }, 300)
    let InitSearch = () => {
        

        $('#MachineSearch').keypress((e) => {
            let search = $('#MachineSearch').val()
            if (e.keyCode == 13) {       
                DataMachineTable(CurrentCusID, 1)
            }
            
        })
    }
    function InitCustomerSelect() {

        GetDataList('/JabilAPI/GetListCustomer', ShowCustomerSelect)
        GetDataList('/FXReader/GetFXList', ShowFXReaderSelect)
    }
    let InitMachineCheckBtn = function () {
        $('.btnCheckMachine').click(function () {
            let machineName = $(this).closest('.input-group').find('input[name="MachineName"]').val();
            CheckMachine(machineName)
        })
        $('input[name="MachineName"]').keyup(function (e) {
            if (e.keyCode == 13) {
                let machineName = $(this).closest('.input-group').find('input[name="MachineName"]').val();
                CheckMachine(machineName)
            }
        });

    }
    let CheckMachine = debounce(function (MachineName) {
        MachineName = MachineName.trim()
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
                    $('input[name="MachineInfo"]').val(`${data.Vendor}/${data.Model}/${data.CommonName}`)
                    $('input[name="MachineID"]').val(`${data.Equipment_ID}`)
                    $('input[name="FXReaderName"]').val(`${data.FXReaderName != null ? data.FXReaderName:``}`)
                    $('input[name="IPAddress"]').val(`${data.IPAddress != null ? data.IPAddress : ``}`)
                    
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
    }, 300)

    const DataMachineTable = debounce( function (customerID) {
        page = 1
        table.find('tbody').empty()
        let search = $('#MachineSearch').val().trim()
        ShowMachineTable(customerID, page, search)


          
    },300)
    function ScrollData(page) {
       
        let search = $('#MachineSearch').val().trim()
        ShowMachineTable(CurrentCusID, page, search)
    }

    function initUserRowClick($tr) {
        $tr.click(function () {
            let UserID = $(this).data('userid')
            GetUserDetail(UserID)
        })
    }

    
    var ShowMachineTable = debounce( function(customerID, pagenumber, search) {
        if (!isLoadingData) {
            let body = table.find('tbody')
            $.ajax({
                type: "GET",
                url: "/Machine/GetCustomerMachine",
                data: {
                    customerID,
                    search,
                    page: pagenumber,
                },
                beforeSend: function () {
                    isLoadingData = true
                },
                datatype: 'json',
                success: function (data) {
                    if (data.Status) {
                        isFull = false
                        //Hiển thị dữ liệu trong bảng

                        if (data.data && data.data.length > 0) {
                            $.each(data.data, function (i, v) {

                                let tr = `<tr class="table-row" data-machineid ="${v.ID}">
                            <th scope="row">${((10 * (data.pageCurrent - 1)) + (i + 1))}</th>
                            <td>${v.Name}</td>
                            <td>${v.FXReaderName}</td>
                            <td>${v.IPAddress}</td>
                            
                            <td>
                                <a href="#" class="btn btn-light-danger font-weight-bold mr-2 btnDeleteMachine">Delete</a>
                            </td>
                            </tr>`

                                body.append(tr)
                                
                            })
                            pagenumber++
                            page = pagenumber


                            isFull = data.to == data.total

                        }
                        $('.btnDeleteMachine').click(function (e) {
                            e.preventDefault()
                           let machineID = $(this).closest('tr').data('machineid')
                           DeleteMachineOfCustomer(machineID,CurrentCusID)
                        })
                       

                        table.parent().next().find('.dataTables_info').text(`Showing ${data.to} of ${data.total} records`)
                    } else {
                        toastr.error(
                            response.Message,
                            'Erorr'
                        );
                    }
                    isLoadingData = false;
                    
                },
                error: function () {
                    isLoadingData = false;
                }
            })
        }

    }, 300)

    let isInitSelectEvent = false
    function ShowCustomerSelect(data) {
        $select = $('#CustomersSelect')
        $select.val('').trigger('change');
        const mapData = data.map(item => {
            return {
                id: `${item.Customer_ID}`,
                text: `${item.CustomerName}`
            };
        });
        mapData.unshift({
            id: "",
            text: `Customers`
        })
        $select.select2({
            placeholder: "Customers",

            data: mapData,

        });

        if (!isInitSelectEvent) {
            //Event select customer
            CustomerSelectEvent($select)
            isInitSelectEvent = true
        }

    }
    function CustomerSelectEvent($select) {
        $select.change(function () {
            $('#MachineSearch').val('')
            CurrentCusID = $(this).val()
            DataMachineTable(CurrentCusID)
        })

    }

    function CustomerSelectEvent($select) {
        $select.change(function () {
            $('#MachineSearch').val('')
            CurrentCusID = $(this).val()
            DataMachineTable(CurrentCusID)
        })

    }
    
    const DeleteMachineOfCustomer = debounce(function (machineID, customerID) {
        $.ajax({
            type: "POST",
            url: '/Machine/DeleteMachineToCustomer',

            data: {
                machineID: machineID + '',
                customerID
            },
            success: function (result) {
                // Xử lý kết quả từ action
                if (result.Status) {
                    toastr.success(
                        'Deleted!',
                        'Success'
                    );

                    DataMachineTable(CurrentCusID)
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
}
