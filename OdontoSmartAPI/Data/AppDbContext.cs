using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using OdontoSmartAPI.Models;

namespace OdontoSmartAPI.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Consultorio> Consultorios { get; set; }

    public virtual DbSet<Direccion> Direccions { get; set; }

    public virtual DbSet<Empleado> Empleados { get; set; }

    public virtual DbSet<Equipamiento> Equipamientos { get; set; }

    public virtual DbSet<Especialidad> Especialidads { get; set; }

    public virtual DbSet<EstadoTurno> EstadoTurnos { get; set; }

    public virtual DbSet<HistorialClinico> HistorialClinicos { get; set; }

    public virtual DbSet<HistorialEstadoTurno> HistorialEstadoTurnos { get; set; }

    public virtual DbSet<Insumo> Insumos { get; set; }

    public virtual DbSet<Localidad> Localidads { get; set; }

    public virtual DbSet<ObraSocial> ObraSocials { get; set; }

    public virtual DbSet<ObraSocialPrestacion> ObraSocialPrestacions { get; set; }

    public virtual DbSet<Odontologo> Odontologos { get; set; }

    public virtual DbSet<OdontologoEspecialidad> OdontologoEspecialidads { get; set; }

    public virtual DbSet<Paciente> Pacientes { get; set; }

    public virtual DbSet<Prestacion> Prestacions { get; set; }

    public virtual DbSet<PrestacionTurno> PrestacionTurnos { get; set; }

    public virtual DbSet<Provincia> Provincia { get; set; }

    public virtual DbSet<Puesto> Puestos { get; set; }

    public virtual DbSet<Turno> Turnos { get; set; }

    public virtual DbSet<TurnoInsumo> TurnoInsumos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Consultorio>(entity =>
        {
            entity.HasKey(e => e.IdConsultorio).HasName("PK__Consulto__287E81601E119FDA");

            entity.ToTable("Consultorio");

            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.HasOne(d => d.IdDireccionNavigation).WithMany(p => p.Consultorios)
                .HasForeignKey(d => d.IdDireccion)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Consultorio_Direccion");
        });

        modelBuilder.Entity<Direccion>(entity =>
        {
            entity.HasKey(e => e.IdDireccion).HasName("PK__Direccio__1F8E0C76B72AD504");

            entity.ToTable("Direccion");

            entity.Property(e => e.Barrio)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Calle)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Cp)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("CP");

            entity.HasOne(d => d.IdLocalidadNavigation).WithMany(p => p.Direccions)
                .HasForeignKey(d => d.IdLocalidad)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Direccion_Localidad");
        });

        modelBuilder.Entity<Empleado>(entity =>
        {
            entity.HasKey(e => e.IdEmpleado).HasName("PK__Empleado__CE6D8B9E36631972");

            entity.ToTable("Empleado");

            entity.Property(e => e.Apellido)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Correo)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Dni)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("DNI");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Telefono)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.HasOne(d => d.IdDireccionNavigation).WithMany(p => p.Empleados)
                .HasForeignKey(d => d.IdDireccion)
                .HasConstraintName("FK_Empleado_Direccion");

            entity.HasOne(d => d.IdPuestoNavigation).WithMany(p => p.Empleados)
                .HasForeignKey(d => d.IdPuesto)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Empleado_Puesto");
        });

        modelBuilder.Entity<Equipamiento>(entity =>
        {
            entity.HasKey(e => e.IdEquipamiento).HasName("PK__Equipami__4439660DC9B9E9DD");

            entity.ToTable("Equipamiento");

            entity.Property(e => e.Marca)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Modelo)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.NroSerie)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.HasOne(d => d.IdConsultorioNavigation).WithMany(p => p.Equipamientos)
                .HasForeignKey(d => d.IdConsultorio)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Equipamiento_Consultorio");
        });

        modelBuilder.Entity<Especialidad>(entity =>
        {
            entity.HasKey(e => e.IdEspecialidad).HasName("PK__Especial__693FA0AF3BEBE783");

            entity.ToTable("Especialidad");

            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<EstadoTurno>(entity =>
        {
            entity.HasKey(e => e.IdEstadoTurno).HasName("PK__EstadoTu__BB9A37DFFD3A6801");

            entity.ToTable("EstadoTurno");

            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<HistorialClinico>(entity =>
        {
            entity.HasKey(e => e.IdHistorialClinico).HasName("PK__Historia__14B3DC2BCA26E122");

            entity.ToTable("HistorialClinico");

            entity.Property(e => e.Anulado).HasDefaultValue(false);
            entity.Property(e => e.MotivoAnulacion).HasMaxLength(300);
            entity.Property(e => e.FechaAnulacion)
                .HasColumnType("datetime2")
                .HasConversion(
                    value => value,
                    value => value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : value);

            entity.Property(e => e.Diagnostico)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.Observaciones)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.TratamientosRealizados)
                .HasMaxLength(500)
                .IsUnicode(false);

            entity.HasOne(d => d.IdPacienteNavigation).WithMany(p => p.HistorialClinicos)
                .HasForeignKey(d => d.IdPaciente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HistorialClinico_Paciente");

            entity.HasOne(d => d.IdTurnoNavigation).WithMany(p => p.HistorialClinicos)
                .HasForeignKey(d => d.IdTurno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HistorialClinico_Turno");
        });

        modelBuilder.Entity<HistorialEstadoTurno>(entity =>
        {
            entity.HasKey(e => e.IdHistorialEstadoTurno).HasName("PK__Historia__9FE2BB9BA6646705");

            entity.ToTable("HistorialEstadoTurno");

            entity.Property(e => e.FechaHora).HasColumnType("datetime");

            entity.HasOne(d => d.IdEstadoTurnoNavigation).WithMany(p => p.HistorialEstadoTurnos)
                .HasForeignKey(d => d.IdEstadoTurno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HistorialEstadoTurno_EstadoTurno");

            entity.HasOne(d => d.IdTurnoNavigation).WithMany(p => p.HistorialEstadoTurnos)
                .HasForeignKey(d => d.IdTurno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_HistorialEstadoTurno_Turno");
        });

        modelBuilder.Entity<Insumo>(entity =>
        {
            entity.HasKey(e => e.IdInsumo).HasName("PK__Insumo__F378A2AF39C4813E");

            entity.ToTable("Insumo");

            entity.Property(e => e.Descripcion)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.UnidadMedida)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Localidad>(entity =>
        {
            entity.HasKey(e => e.IdLocalidad).HasName("PK__Localida__27432612A1E30E30");

            entity.ToTable("Localidad");

            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.HasOne(d => d.IdProvinciaNavigation).WithMany(p => p.Localidads)
                .HasForeignKey(d => d.IdProvincia)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Localidad_Provincia");
        });

        modelBuilder.Entity<ObraSocial>(entity =>
        {
            entity.HasKey(e => e.IdObraSocial).HasName("PK__ObraSoci__D470638C581B8B76");

            entity.ToTable("ObraSocial");

            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<ObraSocialPrestacion>(entity =>
        {
            entity.HasKey(e => e.IdObraSocialPrestacion).HasName("PK__ObraSoci__5E77C7255658B789");

            entity.ToTable("ObraSocialPrestacion");

            entity.Property(e => e.MontoCubierto).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.IdObraSocialNavigation).WithMany(p => p.ObraSocialPrestacions)
                .HasForeignKey(d => d.IdObraSocial)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ObraSocialPrestacion_ObraSocial");

            entity.HasOne(d => d.IdPrestacionNavigation).WithMany(p => p.ObraSocialPrestacions)
                .HasForeignKey(d => d.IdPrestacion)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ObraSocialPrestacion_Prestacion");
        });

        modelBuilder.Entity<Odontologo>(entity =>
        {
            entity.HasKey(e => e.IdOdontologo).HasName("PK__Odontolo__0FB770E8263F8F36");

            entity.ToTable("Odontologo");

            entity.HasIndex(e => e.IdEmpleado, "UQ__Odontolo__CE6D8B9F68A698F0").IsUnique();

            entity.Property(e => e.DiaAtencion)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.HorarioAtencion)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.NroMatricula)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.IdEmpleadoNavigation).WithOne(p => p.Odontologo)
                .HasForeignKey<Odontologo>(d => d.IdEmpleado)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Odontologo_Empleado");
        });

        modelBuilder.Entity<OdontologoEspecialidad>(entity =>
        {
            entity.HasKey(e => e.IdOdontologoEspecialidad).HasName("PK__Odontolo__410D23B0A2823BD1");

            entity.ToTable("OdontologoEspecialidad");

            entity.HasOne(d => d.IdEspecialidadNavigation).WithMany(p => p.OdontologoEspecialidads)
                .HasForeignKey(d => d.IdEspecialidad)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OdontologoEspecialidad_Especialidad");

            entity.HasOne(d => d.IdOdontologoNavigation).WithMany(p => p.OdontologoEspecialidads)
                .HasForeignKey(d => d.IdOdontologo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OdontologoEspecialidad_Odontologo");
        });

        modelBuilder.Entity<Paciente>(entity =>
        {
            entity.HasKey(e => e.IdPaciente).HasName("PK__Paciente__C93DB49B695E00FE");

            entity.ToTable("Paciente");

            entity.Property(e => e.Apellido)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Correo)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Dni)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("DNI");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Telefono)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.HasOne(d => d.IdDireccionNavigation).WithMany(p => p.Pacientes)
                .HasForeignKey(d => d.IdDireccion)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Paciente_Direccion");

            entity.HasOne(d => d.IdObraSocialNavigation).WithMany(p => p.Pacientes)
                .HasForeignKey(d => d.IdObraSocial)
                .HasConstraintName("FK_Paciente_ObraSocial");
        });

        modelBuilder.Entity<Prestacion>(entity =>
        {
            entity.HasKey(e => e.IdPrestacion).HasName("PK__Prestaci__63EE283464C94B05");

            entity.ToTable("Prestacion");

            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Precio).HasColumnType("decimal(10, 2)");
        });

        modelBuilder.Entity<PrestacionTurno>(entity =>
        {
            entity.HasKey(e => e.IdPrestacionTurno).HasName("PK__Prestaci__32AF4A84462CE930");

            entity.ToTable("PrestacionTurno");
            entity.Property(e => e.FechaRealizacion).HasColumnType("date");
            entity.Property(e => e.PrecioAplicado).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.IdPrestacionNavigation).WithMany(p => p.PrestacionTurnos)
                .HasForeignKey(d => d.IdPrestacion)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PrestacionTurno_Prestacion");

            entity.HasOne(d => d.IdTurnoNavigation).WithMany(p => p.PrestacionTurnos)
                .HasForeignKey(d => d.IdTurno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PrestacionTurno_Turno");
        });

        modelBuilder.Entity<Provincia>(entity =>
        {
            entity.HasKey(e => e.IdProvincia).HasName("PK__Provinci__EED7445582D07E30");

            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Pais)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Puesto>(entity =>
        {
            entity.HasKey(e => e.IdPuesto).HasName("PK__Puesto__ADAC6B9CC02E48A9");

            entity.ToTable("Puesto");

            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Turno>(entity =>
        {
            entity.HasKey(e => e.IdTurno).HasName("PK__Turno__C1ECF79A6D74E51D");

            entity.ToTable("Turno");

            entity.HasOne(d => d.IdConsultorioNavigation).WithMany(p => p.Turnos)
                .HasForeignKey(d => d.IdConsultorio)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Turno_Consultorio");

            entity.HasOne(d => d.IdOdontologoNavigation).WithMany(p => p.Turnos)
                .HasForeignKey(d => d.IdOdontologo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Turno_Odontologo");

            entity.HasOne(d => d.IdPacienteNavigation).WithMany(p => p.Turnos)
                .HasForeignKey(d => d.IdPaciente)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Turno_Paciente");
        });

        modelBuilder.Entity<TurnoInsumo>(entity =>
        {
            entity.HasKey(e => e.IdTurnoInsumo).HasName("PK__TurnoIns__78997924DFCBA315");

            entity.ToTable("TurnoInsumo");

            entity.HasOne(d => d.IdInsumoNavigation).WithMany(p => p.TurnoInsumos)
                .HasForeignKey(d => d.IdInsumo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TurnoInsumo_Insumo");

            entity.HasOne(d => d.IdTurnoNavigation).WithMany(p => p.TurnoInsumos)
                .HasForeignKey(d => d.IdTurno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TurnoInsumo_Turno");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
