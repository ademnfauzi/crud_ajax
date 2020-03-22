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
    </script>


</body>
</html>