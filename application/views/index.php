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

    <!-- <script src="<?= base_url('assets/datatables/js/jquery.dataTables.js') ?>"></script> -->
    <script src="<?= base_url('assets/bootstrap/js/bootstrap.min.js') ?>"></script>
    <!-- <script src="<?= base_url('assets/datatables/js/dataTables.bootstrap.js') ?>"></script> -->
    <!-- <script>
        $(document).ready(function() {
            $('#table').DataTable();
        });


        function getBarang(){
            $.ajax({
                type:'POST',
                url:'<?= base_url(); ?>barang/getBarang',
                dataType:'json',
                success: function(data){
                    console.log(data);
                }
            });
        }
    </script> -->


</body>
</html>