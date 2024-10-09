{
    "use strict";
    var page = 1;
    var isLoadingData = false;
    var isFull = false;
    let form = $(`#MachineMonitorsForm`)
    
    jQuery(document).ready(function () {
       
        $('#btnRefreshMonitor').on('click', function () {
            DataMachineMonitor()
        })
       

    });

    function SearchMachineMonitor(e) {
        DataMachineMonitor()
    }


    var DataMachineMonitor = debounce(function () {
        let search = $('#MachineSearch').val().trim(); // Giả sử bạn có một input để nhập tiêu chí tìm kiếm
        let machine = $('#search_monitor_Machine').val();
        

        $.ajax({
            type: "GET",
            url: "/Machine/GetMachineMonitor",
            data: {
                search,
                machine,
              
            },
            beforeSend: function () {
                // Có thể thêm logic để hiển thị loader
            },
            datatype: 'json',
            success: function (data) {
                if (data.Status) {
                    ShowMachineMonitor(data.Data);
                } else {
                    toastr.error(data.Message, 'Error');
                }
            },
            error: function () {
                toastr.error('Error fetching data', 'Error');
            }
        });
    }, 300);

    //var DataMachineMonitor = debounce(function () {
    //    $.ajax({
    //        type: "GET",
    //        url: "/Machine/GetMachineMonitor",
    //        beforeSend: function () {
                
    //        },
    //        datatype: 'json',
    //        success: function (data) {
    //            if (data.Status) {
    //                ShowMachineMonitor(data.Data)
    //            } else {
    //                toastr.error(
    //                    data.Message,
    //                    'Erorr'
    //                );
    //            }
              
    //        },
    //        error: function () {
                
    //        }
    //    })

    //},300)
    
    function ShowMachineMonitor(data) {
        
        let monitors = `<div class="form-group row">`
        $.each(data, function (i, v) {
            let stt = {
                'Running': {
            
                    'class': 'svg-icon-success'

                },
                'Stop': {
                   
                    'class': 'svg-icon-dark'

                },
                'Fail': {
                    
                    'class': 'svg-icon-danger'

                },
                'No Data': {
                    
                    'class': ''

                }

            };
         
                       
            monitors += `<div class="col-lg-3" align="center">
                            <p>${v.MachineInfo}</p>
                            <span class="svg-icon svg-icon-10x mr-5 ${stt[v.lastStt].class} ">
                                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                     <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                        <rect x="0" y="0" width="24" height="24"/>
                                        <path d="M4.5,6 L19.5,6 C20.8807119,6 22,6.97004971 22,8.16666667 L22,16.8333333 C22,18.0299503 20.8807119,19 19.5,19 L4.5,19 C3.11928813,19 2,18.0299503 2,16.8333333 L2,8.16666667 C2,6.97004971 3.11928813,6 4.5,6 Z M4,8 L4,17 L20,17 L20,8 L4,8 Z" fill="#000000" fill-rule="nonzero"/>
                                        <polygon fill="#000000" opacity="0.3" points="4 8 4 17 20 17 20 8"/>
                                        <rect fill="#000000" opacity="0.3" x="7" y="20" width="10" height="1" rx="0.5"/>
                                    </g>
                                </svg>                                
                            </span>
                            <p>Status: ${v.lastStt}</p>
                            <p>Last Record: ${v.lastRecord}</p>                          
                        </div>`
            if (i + 1 == data.length) monitors += `</div>`
            else if ((i + 1) % 4 == 0) monitors += `</div><div class="form-group row">`

        })
        $('#MachineMonitorsForm').empty()
        $('#MachineMonitorsForm').append(monitors)
       
    }
    $('#search_report_Machine, #MachineSearch, #search_report_Status').on('change keyup', function () {
        DataMachineMonitor();
    });
}