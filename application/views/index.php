<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRUD AJAX </title>         
    <link rel="stylesheet" href="<?= base_url('assets/bootstrap/css/bootstrap.min.css'); ?>">
    <link rel="stylesheet" href="<?= base_url('assets/bootstrap/css/bootstrap.css'); ?>">
    <!-- <link rel="stylesheet" href="<?= base_url('assets/datatables/css/dataTables.bootstrap.css'); ?>"> -->
    <script src="<?= base_url('assets/jquery/jquery.js') ?>"></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.20/css/jquery.dataTables.css">



</head>
<body>
    <div class="container">
        <h1>CRUD AJAX WITH DATATABLES</h1>
        <br>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#catchBarang">
            ADD BARANG
        </button>
        <br>
    <div class="table-responsive">
        <table class="table table-hover" id="table">
            <thead class="bg-info">
                <tr>
                    <th>ID</th>
                    <th>NAMA BARANG</th>
                    <th>HARGA SATUAN</th>
                    <th>JUMLAH</th>
                    <th>KETERANGAN</th>
                </tr>
            </thead>
            <tbody id="show">

            </tbody>
        </table>
    </div>
    </div>

    <!-- Modal -->
<div class="modal fade" id="catchBarang" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">ADD BARANG</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <form action="" method="post">
            <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="nama">NAMA BARANG</span>
                    </div>
                <input type="text" class="form-control" name="nama" id="nama" aria-label="Username" aria-describedby="basic-addon1">
                <p class="validasi_nama"></p>
            </div>

            <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="basic-addon1">HARGA SATUAN</span>
                    </div>
                <input type="text" class="form-control" name="harga_satuan" id="harga_satuan">
                <p class="validasi_harga_satuan"></p>
            </div>

            <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="basic-addon1">JUMLAH</span>
                    </div>
                <input type="text" class="form-control" name="jumlah" id="jumlah">
                <p class="validasi_jumlah"></p>
            </div>        

            <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text" id="basic-addon1">KETERANGAN</span>
                    </div>
                <input type="text" class="form-control" name="keterangan" id="keterangan">
                <p class="validasi_keterangan"></p>
            </div>        
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-success" onclick="addBarang()">Save changes</button>
      </div>
    </div>
  </div>
</div>

    <script src="<?= base_url('assets/bootstrap/js/bootstrap.min.js') ?>"></script>
    <!-- <script src="<?= base_url('assets/datatables/js/jquery.dataTables.min.js') ?>"></script> -->
    <!-- <script src="<?= base_url('assets/datatables/js/dataTables.bootstrap.min.js') ?>"></script> -->
    <!-- <script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="" crossorigin="anonymous"></script> -->
    <script src="https://cdn.datatables.net/1.10.10/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.10.16/js/dataTables.bootstrap4.min.js"></script>
    <!-- <script src="https://cdn.datatables.net/rowreorder/1.2.3/js/dataTables.rowReorder.min.js"></script>
    <script src="https://cdn.datatables.net/select/1.2.3/js/dataTables.select.min.js"></script> -->
    <script>
        $(document).ready(function() {
            $('#table').DataTable();
        });


        function getBarang(){
            $.ajax({
                type:'POST',
                url:'<?= base_url(); ?>barang/getBarang',
                dataType:'json',
                success: function(data){
                    let baris = '';
                    for(var i=0;i<data.length;i++){
                        baris += '<tr>'+
                                        '<td>'+ data[i].id +'</td>' +
                                        '<td>'+ data[i].nama +'</td>' +
                                        '<td>'+ data[i].harga_satuan +'</td>' +
                                        '<td>'+ data[i].jumlah +'</td>' +
                                        '<td>'+ data[i].keterangan +'</td>' +
                                '</tr>';
                    }
                    $('#show').html(baris);
                }
            });
        }
        getBarang();

        
        function addBarang(){
            let nama = $("[name='nama']").val();
            let harga = $("[name='harga_satuan']").val();
            let jumlah = $("[name='jumlah']").val();
            let keterangan = $("[name='keterangan']").val();
            let url = 'http://localhost/crud_ajax/barang/addBarang';
            $.ajax({
                type:'POST',
                url:'http://localhost/crud_ajax/barang/addBarang',
                data:'nama='+nama+'&harga_satuan='+harga+'&jumlah='+jumlah+'&keterangan='+keterangan,
                dataType:'json',
                success: function(data){
                    if (data !== 'sukses') {
                        $(".validasi_nama").html(data.nama);
                        $(".validasi_harga_satuan").html(data.harga_satuan);
                        $(".validasi_jumlah").html(data.jumlah);
                        $(".validasi_keterangan").html(data.keterangan);
                    } else {
                        $('#catchBarang').modal('hide');
                        getBarang();

                        $("[name='nama']").val('');
                        $("[name='harga_satuan']").val('');
                        $("[name='jumlah']").val('');
                        $("[name='keterangan']").val('');
                    }
                }
            });
        }
    </script>


</body>
</html>