<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Barang extends CI_Controller {
    public function index(){
        $this->load->view('index');
    }
    public function getBarang(){
        $get = $this->b_m->getBarang();
        echo json_encode($get);
    }
}