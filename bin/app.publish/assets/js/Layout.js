var $table;
var $form;
var CurrentUser = null

SetAccount()

 function SetAccount() {
    try {
        GetAccount();
        // Gọi tới hàm xử lý dữ liệu sau khi đã nhận được kết quả từ AJAX.
        // Ví dụ:
        
        if (CurrentUser == null) {
            /*window.location.href = "/Login";*/
        }
        InitButton()
       
        
        
    } catch (error) {
        // Xử lý lỗi
        console.log(error);
        window.location.href = "/Login";
    }
}



function GetAccount() {
    $.ajax({
        type: "GET",
        url: '/Login/GetCurrentAccount',
        datatype: "json",
        async: false,
        success: function (data) {
            if (data.status) {
                $('.Account').text(data.user.JabilID);
                $('.Name').text(data.user.FullName);
                CurrentUser = data.user
                //If user dont have customer
                GetToken()
                SetCustomer(data.user.Customers)       
            } else {
                reject("User not authenticated");
            }
        },
        error: function () {
            reject("Error occurred");
        }
    });
    

}
function InitButton() {
    $('#btnCustomerDefaultSetup').click(function (e) {
        e.preventDefault()
        SetCustomer(CurrentUser.Customers)
    })
}


function MaskInput() {
    $('.ip').mask('099.099.099.099', {
        placeholder: "___.___.___"
    });
}


function SetCustomer(data) {
  
    $select = $('#select_customers')
    if (data.length > 0) {
        data.unshift({
            id: "",
            text: `Customers`
        })
        $select.select2({
            data: data,
            width: 'element',
            templateResult: formatOutput
        });
    }
    //if (CurrentUser.CustomerID != null) {
    //    $select.val(CurrentUser.CustomerID).trigger('change')
    //}

   
}
/// start:Select

function InitSelect() {
    
    $('.select2').select2()
    var prevselection = null;

    $('#select_customer').select2({
        placeholder: "Customer",
       
    }).on('select2:opening', function (event) {
        prevselection = $(event.target).find(':selected');
        $(this).val(null);
    }).on('select2:select', function (event) {

        var _selection = $(event.target).find(':selected');
        var available = _selection.data('available');

        if (available === false) {
            alert('ok')
        }

    }).on('select2:closing', function (event) {
        if (prevselection != null && $(this).val() == null) {
            $(this).val($(prevselection).val())
        }
    });
    $('#select_machines').select2({
        placeholder: "Machine",
       
    }).on('select2:opening', function (event) {
        prevselection = $(event.target).find(':selected');
        $(this).val(null);
    }).on('select2:select', function (event) {

        var _selection = $(event.target).find(':selected');
        var available = _selection.data('available');

        if (available === false) {
            alert('ok')
        }

    }).on('select2:closing', function (event) {
        if (prevselection != null && $(this).val() == null) {
            $(this).val($(prevselection).val())
        }
    });


    $('#select_assembly').select2({
        placeholder: "Assembly",
       
    }).on('select2:opening', function (event) {
        prevselection = $(event.target).find(':selected');
        $(this).val(null);
    }).on('select2:select', function (event) {

        var _selection = $(event.target).find(':selected');
        var available = _selection.data('available');

        if (available === false) {
            alert('ok')
        }

    }).on('select2:closing', function (event) {
        if (prevselection != null && $(this).val() == null) {
            $(this).val($(prevselection).val())
        }
    });

    $('#select_equipmentSetupSheets').select2({
        placeholder: "Equipment Setup Sheet",

    }).on('select2:opening', function (event) {
        prevselection = $(event.target).find(':selected');
        $(this).val(null);
    }).on('select2:select', function (event) {

        var _selection = $(event.target).find(':selected');
        var available = _selection.data('available');

        if (available === false) {
            alert('ok')
        }

    }).on('select2:closing', function (event) {
        if (prevselection != null && $(this).val() == null) {
            $(this).val($(prevselection).val())
        }
    });
  /* selectMachines(CurrentUser.Machines)*/
    
    
    LevelSelect()
}
var listMachine
function selectMachine($select, CustomerID) {
    $.ajax({
        type: "GET",
        url: "/Machine/GetMachineOfCustomer",
        data: {
            CustomerID
        },
        datatype: 'json',
        success: function (response) {
            let list = [{ id: "", text: "Machine" }]
            $select.empty().trigger('change')

            if (response.Status) {
                let data = response.Data;
                listMachine = response.Data;
                const mapData = data.map(item => {
                    return {
                        id: item.MachineID,
                        text: item.MachineInfo
                    };
                });
                list = list.concat(mapData)

              

            }
            $select.select2({
                data: list,
                width: 'element',
                templateResult: formatOutput
            });


        },
        error: function () {

        }
    })
}

//function selectMachines(machines) {

//    let $select = $('#select_machines')
//    $select.empty().trigger('change')
//    machines.unshift({ id: "", text: "Machine" })
//    $select.select2({
//        data: machines,
//        width: 'element'
//    });


//}

var listAssembly = null

function selectAssembly($select, CustomerID) {
    //The assembly is not affected by the machine, so it is only taken once
    if (listAssembly == null) {
        $.ajax({
            type: "GET",
            url: "/JabilAPI/GetListAssembly",
            data: {
                CustomerID
            },
            datatype: 'json',
            success: function (response) {

                let list = [{ id: "", text: "Assembly" }]
                $select.empty().trigger('change')

                if (response.status) {
                    let data = response.list;
                    listAssembly = response.list;
                    const mapData = data.map(item => {
                        return {
                            id: item.Assembly_ID,
                            text: `${item.Number} / ${item.Revision} / ${item.AssemblyName}`
                        };
                    });
                    list = list.concat(mapData)



                }
                $select.select2({
                    data: list,
                    width: 'element',
                    templateResult: formatOutput
                });

            },
            error: function () {

            }
        })
    } else {
        let list = [{ id: "", text: "Assembly" }]
        $select.empty().trigger('change')
        const mapData = listAssembly.map(item => {
            return {
                id: item.Assembly_ID,
                text: `${item.Number} / ${item.Revision} / ${item.AssemblyName}`
            };
        });
        list = list.concat(mapData)


        $select.select2({
            data: list,
            width: 'element',
            templateResult: formatOutput
        });


    }
       
}
function GetAssembly(CustomerID) {
    //The assembly is not affected by the machine, so it is only taken once
        $.ajax({
            type: "GET",
            url: "/JabilAPI/GetListAssembly",
            data: {
                CustomerID
            },
            datatype: 'json',
            success: function (response) {
                if (response.status) {
                    let data = response.list;
                    listAssembly = response.list;
                }
            },
            error: function () {

            }
        })
}
var EquipmentSetupList = null
function selectEquipmentSetup(AssemblyID, MachineID, $select) {
   
    $.ajax({
        type: "GET",
        url: "/JabilAPI/GetListEquipmentSetups",
        data: {
            AssemblyID,
            MachineID
        },
        datatype: 'json',
        success: function (response) {
            let list = [{ id: "", text: "EquipmentSetup" }]
            $select.empty().trigger('change')

            if (response.status) {
                let data = response.list;
                EquipmentSetupList = response.list
                const mapData = data.map(item => {
                    return {
                        id: `${item.EquipmentSetup_ID}|${item.Equipment_ID}`,
                        text: `${item.SetupNumber}/${item.SetupVersion}/${item.MachineName}/${item.ProgramName}`
                    };
                });
                list = list.concat(mapData)
                
                SetSelectEvent($select, setSetupSheet)
                
            }
            $select.select2({
                data: list,
                width: 'element',
                templateResult: formatOutput
            });
           

        },
        error: function () {
          
        }
    })
   
}

function SetSelectEvent($select, callback) {
    if (!$select.data('isinitevent')) {
        $select.on('change', function (e) {
            e.preventDefault()
            ClearSetupSheet(callback($(this).val()))
        })
        $select.data('isinitevent', true)
    }
    
}
///end:Select
var SlotCheck
var SetupSheet
var setSetupSheet = debounce(function (ID) {
    /* ID = "287408"*/
    
    let $table = $('#EquipmentSystemSheet')
    let $body = $table.find('tbody')
    $body.empty()
    if (ID != "" && ID != null) {
        ///Get SetupSheet
        let idArr = ID.split('|')
        $.ajax({
            type: "GET",
            url: "/JabilAPI/GetSetupSheet",
            data: {
                ID: idArr[0]
            },
            datatype: 'json',
            success: function (response) {
                if (response.status) {
                    
                    let data = response.list;
                    
                    $.each(data, function (i, v) {
                        let color = v.Action == "OK" ? "#89ff75" : "#ff7575"
                        let stt = v.Action == "OK" ? "Match" : "Unmatch"
                        let tr = `<tr id ="${v.RequiredPart.replace('\n','').trim()}" data-match =${v.Action == "OK"} style="background:${color}; font-weight: bold;">
                                            <td scope="row">${v.ComponentLocation}</td>
                                            <td scope="row">${v.RequiredPart}</td>
                                            <td class="grn">${v.Grn}</td>
                                            <td class="status">
                                                ${stt}
                                            </td>
                                        </tr>`
                        $body.append(tr)
                    })
                    SetupSheet = data;
                   
                    if (isCompleteGRNScan()) {
                        SuccesRecordData()
                    }
                }


            },
            error: function () {

            }
        })
        //Get Tracker (slot)
        $.ajax({
            type: "GET",
            url: "/JabilAPI/GetListFeederByEquipmentSetup",
            data: {
                ID: idArr[0]
            },
            datatype: 'json',
            success: function (response) {
                if (response.status) {
                    let data = response.list;
                    if (data != null)
                        SlotCheck = data
                }


            },
            error: function () {

            }
        })

    }

},300)
function isCompleteGRNScan() {
    // Sử dụng phương thức some() để kiểm tra xem có ít nhất một phần tử thỏa mãn điều kiện hay không
    // Kiểm tra xem có thẻ nào có data=false hay không
    var hasDataFalse = $("#EquipmentSystemSheet tbody tr").filter(function () {
        return $(this).data("match") === false; // Thay "your-data-attribute" bằng tên thuộc tính data cụ thể bạn muốn kiểm tra
    }).length > 0;
    return !hasDataFalse
    
}
function LevelSelect() {
    let selections = $('.setupselection')
    selections.each(function (index) {
        let select = $(this)
        select.on('change',function () {
            var selectedValue = select.val();
            disableSelectsAfterIndex(index, selectedValue);
            if (selectedValue != '' && selectedValue !== undefined && selectedValue != null) {
                // Gọi hàm xử lý tùy thuộc vào giá trị đã chọn
                handleMenuChange(index, selectedValue);
            }
        });
    });
    
    // Hàm vô hiệu hóa select sau index 
    function disableSelectsAfterIndex(index, value) {
        //Nếu chọn select giá trị rỗng
        if (value != '' && value != null) {
            //Mở cho select ở level kế tiếp
            index += 1
            //Select
            $(selections[index]).prop("disabled", false);
            //label
            $(selections[index]).next().prop("disabled", false);

         
        }
        //vô hiệu hóa các select còn lại
        for (var i = index + 1; i < selections.length; i++) {            
            if (!$(selections[i]).prop('disabled')) {
            //select
            $(selections[i]).val('').trigger('change').prop("disabled", true);
            //label
            $(selections[i]).next().prop("disabled", false);
            }
            //disconnect reader if machine select disable
            if (i == 1) {
                DisconnectReader()
            }
        }
    }

    // Hàm xử lý thay đổi select tùy thuộc vào giá trị đã chọn
    function handleMenuChange(index, selectedValue) {
        let $selection = $(selections[index])
        switch (index) {
            case 0:
                //select Customer
                selectMachine($(selections[index + 1]), $selection.val())
                GetAssembly($('#select_customers').val())
                // DisconnectReader
                DisconnectReader()
                break;
            case 1:
                // Select Machine
               
                SetCurrentMachine($selection.val())
                selectAssembly($(selections[index + 1]), $('#select_customers').val())
                           
                break;
            case 2:
                // Select assembly
                selectEquipmentSetup($selection.val(), $(selections[index - 1]).val(), $(selections[index + 1]))
                break;
            case 3:
                // Xử lý cho Route 4
                break;
            default:
                break;
        }
    }
    
};
function DisconnectReader() {
    ReaderIP = null
    SetRFIDStt(false)
}
function SetCurrentMachine(ID) {
    $.ajax({
        type: "POST",
        url: "/Machine/SetCurrentMachine",
        data: {
            ID
        },
        datatype: 'json',
        success: function (response) {
            if (response.Status) {
                getRFIDToken()
            } else {
                ReaderIP = null
                toastr.error(response.Message)
                SetRFIDStt(response.Status)
            }
        },
        error: function () {

        }
    })
}
function InitSetup() {
    //sự kiện chọn setup
    $('.Setup').click(function (params) {
        let type = $(this).data('type')
        SetDatatable(type)
        $(`#${type}Modal`).modal()
        $(`#${type}Form`).trigger('reset');
        
    })
    //Hiển thị dữ liệu modal
    function SetDatatable(setupName) {
        $form = $(`#${setupName}Form`)
        $table = $(`#${setupName}Table`)
        switch (setupName) {
            case 'Readers':
                DataReaderTable()
                break;
            case 'Users':
                InitUserForm()
                break;
            case 'Machines':
                InitMachineForm()
                break;
            case 'Settings':
                InitSettingData()
                break;
            case 'TagMapping':
                DataTagMappingTable()
                break;
            case 'Reports':
                DataReportTable()
                break;
            case 'MachineMonitors':
                DataMachineMonitor()
                break;
            default:
                break;
        }
    }
    //Sự kiện đổi tab
    var OldTab
    $('.tab').click(function () {
        let tab = $(this).data('tab')
        if (tab != OldTab) {
            switch (tab) {
                //tab user
                case 'user':
                    
                    InitUserForm()

                    break;
                //tab role
                case 'role':
                  
                    DataRoleTable()
                    break;
                default:
                    break;
            }
        }
        
        OldTab = $(this).data('tab')
    })
    //Refresh Setup Sheet button
    $('#btnRefresh').click(function(e){
        e.preventDefault()
        RefreshSetupSheet()
    })
   
};



//Set dữ liệu cho select
var GetDataList = function (url,callback) {
    $.ajax({
        type: "Get",
        url: url,


        datatype: 'json',
        success: function (response) {
            if (response.Status) {
                
                let data = response.Data
                callback(data)
                
            } else {
                toastr.error(
                    response.Message,
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
function GetToken() {

    $.ajax({
        type: "GET",
        url: '/JabilAPI/GetToken',
        datatype: "json",
        success: function (data) {
            MaskInput()
            InitSelect()
            InitSetup()
        },
        error: function () {
            
           
        }
    })
}
function formatOutput(optionElement) {
    if (!optionElement.id) { return optionElement.text; }
    var $state = $('<span><strong>' + optionElement.text + '</strong></span>');
    return $state;
};
function convertUnixTimeToString(unixTime) {
    var date = new Date(parseInt(unixTime.substr(6)));

    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);
    var seconds = ('0' + date.getSeconds()).slice(-2);

    var formattedDate = day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;

    return formattedDate;
}
// Change RFID STT
function SetRFIDStt(stt) {
    let sttHtml = stt ? `<span class="font-weight-bold text-success">Connected</span>` : `<span class="font-weight-bold text-danger">Disconnected</span>`
    $('#RFIDStt').empty()
    $('#RFIDStt').append(sttHtml)
}
function checkAdminRole() {
    $.ajax({
        type: "GET",
        url: '/JabilAPI/GetToken',
        datatype: "json",
        success: function (data) {
            MaskInput()
            InitSelect()
            InitSetup()
        },
        error: function () {


        }
    })
}