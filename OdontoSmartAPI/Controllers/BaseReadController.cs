
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Data;

namespace OdontoSmartAPI.Controllers
{
    [ApiController]
    public abstract class BaseReadController<TEntity>
        : ControllerBase where TEntity : class
    {
        protected readonly AppDbContext _context;

        protected BaseReadController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public virtual async Task<IActionResult> GetAll()
        {
            var datos = await _context.Set<TEntity>()
                .AsNoTracking()
                .ToListAsync();

            return Ok(datos);
        }
    }
}
