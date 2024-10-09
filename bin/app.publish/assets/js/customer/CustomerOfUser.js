
$('#btnSaveCustomerOfUser').click(function () {
    let customerID = $('#DefaultCustomerSelect').val()
    
    SaveCustomerOfUser(customerID)
})
const SaveCustomerOfUser = debounce(function (CustomerID) {
    if (CustomerID != '') {
        if (CustomerID != CurrentUser.CustomerID) {
            // Gửi Ajax request đến action
            $.ajax({
                type: "POST",
                url: '/User/SetCustomerForUser',
                datatype: "json",
                data: {
                    UserID: CurrentUser.AccountID,
                    CustomerID
                },

                success: function (result) {
                    // Xử lý kết quả từ action
                    if (result.Status) {
                        toastr.success(
                            'Saved!',
                            'Success'
                        );
                        GetAccount(CurrentUser)
                       
                        $('#CustomersModal').modal('hide')
                        
                    } else {
                        // Hiển thị thông báo lỗi
                        toastr.error(
                            result.Message,
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

                }
            });
        } else {
            toastr.success(
                'Saved!',
                'Success'
            );
            $('#CustomersModal').modal('hide')
        }
        
    } else {
        toastr.error(
            'Please select customer!',
            'Erorr'
        );
    }
    
},300)

