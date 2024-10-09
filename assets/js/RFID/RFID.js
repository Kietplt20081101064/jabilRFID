var arrayepc = []; ///Danh sách epc đã đọc
var ReaderIP; ///IP cua reader hien tai
var ReadingTagCount = 1
var startInterval;
var startIntervalRefresh;
var startTimeout;
$(document).ready(function () {
    $('#btnClose').click(function (e) {
        e.preventDefault()
        RFID()
    })
    $('#btnOpen').click(function (e) {
        e.preventDefault()
        Stop()
    })
    
    
    var gpiHub = $.connection.gpiHub;
    console.log(gpiHub)
    gpiHub.client.notify = function (message) {
        console.log(message)
        let currentSetupSheet = $('#select_equipmentSetupSheets').val()
        if (currentSetupSheet != null && currentSetupSheet != '') {
            if (message.IP == ReaderIP) {
                if (message.Status) {
                    RFID()
                } else {
                    Stop()
                }
            }       
        } else {
            toastr.error(
                'SetupSheet is not valid to scan!',
                'Error'
            );
        }
              
    }
    $.connection.hub.start().done(function () {
        console.log('Hub started');
    });
});
  //Hàm xử lý quét RFID
function RFID() {
    try {
        let setup = $('#select_equipmentSetupSheets').val();



        if (setup != '' && setup != null) {
            ClearOldTag()

            startInterval = setInterval(function () {
                ShowAllTags();

            }, 500);
            startIntervalRefresh = setInterval(function () {
                RefreshSetupSheet();

            }, 4000);
            startTimeout = setTimeout(() => {
                if (!isCompleteGRNScan()) {
                    FailRecordData()
                }
            }, 20000)
            DisableSetupSelect(true)
        } else {
            toastr.error(
                `Please select Equipment Setup Sheets to read!`,
                'Erorr'
            );
        }
         
    } catch (error) {
        console.log(error)
    }
}



function DisableSetupSelect(stt) {
    $('.setupselection').each((index, item) => {
        $(item).prop("disabled", stt);
    });
}
function Stop() {
    StopRecordData()
    DisableSetupSelect(false)
    
}


function ClearESS() {
    
    ClearTagReadingTable()
}
function ClearTagReadingTable() {
    $('#TagReadingTable').find('tbody').empty()
    ReadingTagCount = 1
    arrayepc = []
}
function ShowAllTags() {
    try {
       
        $.ajax({
            url: '/rfid/AllShowEPC',
            type: 'get',
            success: function (data) {
                if (data.status) {
                    $.each(data.a, function (k, v) {
                        var body = $('#TagReadingTable').find('tbody')
                        /*  ReadEPC(v.epc)*/
                        if (!arrayepc.includes(v.epc)) {
                            arrayepc.push(v.epc)
                            var tr = `<tr data-id="${v.epc}" style="background: #ff7575; font-weight: bold;">
                                            <td scope="row">${ReadingTagCount++}</td>
                                            <td>${v.epc}</td>
                                            <td class="status">
                                              Unmatch
                                            </td>
                            </tr>`

                            body.append(tr)
                            CheckGRN(v.epc)
                        }

                    })
                } else {
                    toastr.error(
                        data.message,
                        'Erorr'
                    );
                    Stop()
                }
            },
        })
    } catch (error) {
        swal.fire(error.message, "", "error")
    }

}

var canScan = true; // Biến toàn cục để kiểm tra trạng thái quét

function CheckGRN(GRN) {
    if (!canScan) return; // Nếu không được phép quét, trả về ngay lập tức

    $.ajax({
        type: "GET",
        url: "/JabilAPI/GetGRNByName",
        data: { GRN: GRN },
        datatype: 'json',
        success: function (response) {
            if (response.status) {
                let data = response.grn;
                let setupId = $('#select_equipmentSetupSheets').val();

                $.ajax({
                    type: "GET",
                    url: "/RFID/CheckActiveGRN",
                    data: { GRN: GRN },
                    datatype: 'json',
                    success: function (checkResponse) {
                        if (checkResponse.Status) {
                            // Hiển thị thông báo lỗi
                            showErrorWithOkButton(checkResponse.Message);

                            // Ngăn không cho tiếp tục quét
                            canScan = false; // Đặt biến trạng thái quét thành false
                            clearInterval(startInterval);
                            clearInterval(startIntervalRefresh);
                            clearTimeout(startTimeout);
                            DisableSetupSelect(false); // Cho phép chọn thiết bị lại

                        } else {
                            $.each(SlotCheck, function (key, element) {
                                if (element.Material === data.Material) {
                                    let trackID = element.FeederTrayTrack_ID;

                                    CompareEPC(data.Material, GRN);
                                    ReadEPC(GRN);
                                    AddGRNToSetupSheet(data.GRN_ID, trackID, setupId);

                                    if (isCompleteGRNScan()) {
                                        SuccesRecordData();
                                    }
                                }
                            });
                        }
                    },
                    error: function () {
                        toastr.error('Error occurred while checking GRN status.', 'Error');
                    }
                });
            } else {
                toastr.error('GRN not found.', 'Error');
            }
        },
        error: function () {
            toastr.error('Error occurred while retrieving GRN data.', 'Error');
        }
    });
}
function showErrorWithOkButton(message) {
    // Cấu hình toastr để thông báo không tự động biến mất quá nhanh
    toastr.options = {
        closeButton: false,
        debug: false,
        newestOnTop: true,
        progressBar: true,
        positionClass: "toast-top-right",
        preventDuplicates: false,
        onclick: null,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "0", // Không tự động biến mất
        extendedTimeOut: "0", // Không tự động biến mất
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    };

    // Hiển thị thông báo lỗi
    toastr.error(message, 'Error');

    // Thêm nút OK vào thông báo
    var $toast = toastr.getContainer().children().last();
    if ($toast.find('.toast-message').length) {
        $toast.append('<button type="button" class="btn btn-primary ok-button" style="margin-top: 10px;">OK</button>');
        $toast.on('click', '.ok-button', function () {
            toastr.clear(); // Loại bỏ tất cả các thông báo khi nhấn nút OK
            canScan = true; // Cho phép tiếp tục quét sau khi đóng thông báo
        });
    }
}
//function CheckGRN(GRN) {
//    $.ajax({
//        type: "GET",
//        url: "/JabilAPI/GetGRNByName",
//        data: {
//            GRN: GRN
//        },
//        datatype: 'json',
//        success: function (response) {
//            if (response.status) {
//                let data = response.grn;
//                let setupId = $('#select_equipmentSetupSheets').val()
//                $.each(SlotCheck, function (key, element) {
//                    if (element.Material === data.Material) {
//                        let trackID = element.FeederTrayTrack_ID
//                        CompareEPC(data.Material,GRN)
//                        ReadEPC(GRN)
//                        AddGRNToSetupSheet(data.GRN_ID, trackID, setupId)
                        
//                    }
                  
//                    if (isCompleteGRNScan()) {
//                        SuccesRecordData()
//                    }
                        
//                });
               
//            }


//        },
//        error: function () {

//        }
//    })
//}
function AddGRNToSetupSheet(GRNId, TrackID, SetupId) {
    /*"UsrId": 28624,*/
    let addData = {
        "UsrId": CurrentUser.JabilID_ID,
        "SetupId": SetupId.split('|')[0],
        "EquipId": SetupId.split('|')[1],
        "FeederTrayTrackId": TrackID,
        "GrnId": GRNId,
        "Qty": 1,
        "TranportId": 0,
        "SetupFeederType": "",
        "LoadedFeederType": "",
        "Table": "1",
        "Installed": "0",
        "Lane": ""
    }


    $.ajax({
        type: "POST",
        url: "/JabilAPI/AddGrnToMES",
        data: addData,
        datatype: 'json',
        success: function (response) {
            if (response.status) {
               

            }


        },
        error: function () {

        }
    })
}
function CompareEPC(partnum, grn) {
    if (grn != null) {
        //Kiem tra nhung the trong bang reading xem co xuat hien trong Equipment sheet khong
        let tags = $(`tr[data-id="${grn}"]`)
        ///Readinglist
        if (tags.length > 0) {
            tags.css({
                // Màu xanh lá
                'background-color': '#89ff75',
            });
            tags.find('td[class="status"]').text("Match")

        }
        //Sheetup sheet
        if (partnum != null) {
            let slot = $(`#${partnum}`)
            slot.css({
                // Màu xanh lá
                'background-color': '#89ff75',
            });
            slot.data('match', true)
            slot.find('td[class="status"]').text("Match")
            slot.find('td[class="grn"]').text(`${grn}`)
        }
    }
    
    
}

function ReadEPC(epc) {
    $.ajax({
        url: '/rfid/falseEPC',
        type: 'post',
        data: { epc: epc },
        success: function (data) {
            if (data.code == 200) {

            }
        },
    })
}
function ClearOldTag() {
    $.ajax({
        url: '/rfid/DeleteEPC',
        type: 'post',
        
        success: function (data) {
            if (!data.Status) {
                toastr.error(response.Message)
            }
        },
    })
}
function ClearSetupSheet(callback) {
    let setupId = $('#select_equipmentSetupSheets').val()
    /*"UsrId": "12822",*/
    if (setupId != '' && setupId != null) {
        let clearData = {
            "UsrId": CurrentUser.JabilID_ID,
            "SetupId": setupId.split('|')[0],
            "EquipId": setupId.split('|')[1],
            "ClearMachine": "0",
            "Table": "1",
            "RemoveTransport": "0"
        }


        $.ajax({
            type: "POST",
            url: "/JabilAPI/ClearSetupSheet",
            data: clearData,
            datatype: 'json',
            success: function (response) {
                if (response.status) {
                    $('#btnRefresh').trigger('click')
                    callback
                }


            },
            error: function () {

            }
        })
    }
   
}


var getRFIDToken = debounce(function () {
    $.ajax({
        url: '/RFID/GetRFIDToken',
        type: 'Get',
        data: {},
        success: function (response) {
            // Xử lý phản hồi từ server
            SetRFIDStt(response.Status)
            if (response.Status) {
                ReaderIP = response.IP
            } else {
                ReaderIP = null
                toastr.error(response.Message)
            }
        },
        error: function () {
            console.log("Error occurred.");
        }
    });
}, 300)

function RefreshSetupSheet() {
    let ssID = $('#select_equipmentSetupSheets').val()
    if (ssID != null) {
        setSetupSheet(ssID.split('|')[0])
    }
}
