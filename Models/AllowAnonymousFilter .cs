using System.Security.Principal;
using System.Threading;
using System.Web;
using System.Web.Mvc;

public class AllowAnonymousFilter : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext filterContext)
    {
        var headers = filterContext.HttpContext.Request.Headers;
        // Ví dụ: Kiểm tra một header cụ thể để quyết định có bypass xác thực không
        if (headers["Some-Special-Header"] == "SpecialValue")
        {
            // Logics để bypass authentication, như thiết lập một user giả mạo
            var fakeUser = new GenericPrincipal(new GenericIdentity("FakeUser"), null);
            HttpContext.Current.User = fakeUser;
            Thread.CurrentPrincipal = fakeUser;
        }
    }
}
